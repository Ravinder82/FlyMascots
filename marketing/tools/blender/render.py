"""
Sunny in Blender — Cycles, real hair, studio rig.

    blender --background --python marketing/tools/blender/render.py -- \
        --glb studio/pup/sunny.glb --out studio/pup/renders/blender.png \
        --w 1200 --h 675 --samples 48

The glTF is Y-up converted to Z-up on import, and the character faces -Y.
"""
import bpy, sys, math, json
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []


def arg(name, default=None):
    return argv[argv.index(name) + 1] if name in argv else default


GLB = arg('--glb', 'studio/pup/sunny.glb')
OUT = arg('--out', 'studio/pup/renders/blender.png')
W = int(arg('--w', 1200))
H = int(arg('--h', 675))
SAMPLES = int(arg('--samples', 48))
HAIR = arg('--hair', '0') == '1'
DEVICE = arg('--device', 'cpu').lower()
HAIR_LEN = float(arg('--hair-len', 0.02))
# the character faces -Y, so every view is expressed in that frame
# spin the CHARACTER rather than the camera: the studio rig is built for
# one side only, so a camera parked behind the model lands in darkness
TURN = float(arg('--turn', 0))

FUR_MATS = {'Material_0', 'Material_1', 'Material_2', 'Material_4', 'Material_5'}

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)


# ---------------------------------------------------------------- clean up
# the browser scene ships a painted contact-shadow disc; Cycles makes its own
for o in list(bpy.data.objects):
    if o.type == 'MESH' and len(o.data.polygons) <= 4:
        bpy.data.objects.remove(o, do_unlink=True)
IMPORTED_NAMES = [o.name for o in bpy.data.objects]


def mats_of(o):
    return {m.name for m in o.data.materials if m}


# ---------------------------------------------------------------- fur body
fur_objs = [o for o in bpy.data.objects if o.type == 'MESH' and mats_of(o) & FUR_MATS]
for o in bpy.data.objects:
    o.select_set(False)
for o in fur_objs:
    o.select_set(True)
bpy.context.view_layer.objects.active = fur_objs[0]
if len(fur_objs) > 1:
    bpy.ops.object.join()
    bpy.context.view_layer.update()
fur = bpy.context.view_layer.objects.active
fur.name = 'FurBody'

# bake the transform chain so hair length is in world units
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def principled(mat):
    if not mat or not mat.use_nodes:
        return None
    for n in mat.node_tree.nodes:
        if n.type == 'BSDF_PRINCIPLED':
            return n
    return None


def set_in(node, name, value):
    if name in node.inputs:
        node.inputs[name].default_value = value


# ---------------------------------------------------------------- materials
for m in bpy.data.materials:
    p = principled(m)
    if not p:
        continue
    base = tuple(p.inputs['Base Color'].default_value)[:3]
    lum = 0.2126 * base[0] + 0.7152 * base[1] + 0.0722 * base[2]
    is_fur = m.name in FUR_MATS
    if is_fur:
        set_in(p, 'Roughness', 0.72)
        set_in(p, 'Specular IOR Level', 0.28)
        # short fibres scatter almost everything; without this the coat reads
        # as painted plastic no matter how good the lighting is
        set_in(p, 'Subsurface Weight', 0.22)
        set_in(p, 'Subsurface Radius', (0.16, 0.075, 0.032))
        set_in(p, 'Subsurface Scale', 0.045)
        set_in(p, 'Sheen Weight', 1.0)
        set_in(p, 'Sheen Roughness', 0.38)
        set_in(p, 'Sheen Tint', (1.0, 0.72, 0.42, 1.0))
    elif lum < 0.06:
        # Only wet materials (the eye bead) get the glossy treatment. The mouth
        # is authored at roughness 0.85 and must stay matte or it reads as
        # lipstick with a highlight streak.
        if p.inputs['Roughness'].default_value < 0.8:
            set_in(p, 'Roughness', 0.22)
            set_in(p, 'Coat Weight', 0.8)
    elif lum > 0.75:
        set_in(p, 'Roughness', 0.30)          # sclera, glints
    else:
        set_in(p, 'Roughness', 0.62)

# __NORMAL_STRIP__ : kill the baked shell-fur normal map on the coat. Cycles
# now grows real hair, and this texture only reads as vertical skin streaks.
for m in bpy.data.materials:
    pr = principled(m)
    if not pr or m.name not in FUR_MATS or not m.use_nodes:
        continue
    for link in list(m.node_tree.links):
        if link.to_socket == pr.inputs['Normal']:
            m.node_tree.links.remove(link)

# ---------------------------------------------------------------- hair
if HAIR:
    mat_fur = next((m for m in fur.data.materials if m and m.name == 'Material_1'), fur.data.materials[0])
    hair_mat = bpy.data.materials.new('FurHair')
    hair_mat.use_nodes = True
    hp = principled(hair_mat)
    base = tuple(principled(mat_fur).inputs['Base Color'].default_value)
    set_in(hp, 'Base Color', base)
    set_in(hp, 'Roughness', 0.42)
    set_in(hp, 'Sheen Weight', 1.0)
    set_in(hp, 'Sheen Roughness', 0.3)
    fur.data.materials.append(hair_mat)

    bpy.context.view_layer.objects.active = fur
    fur.select_set(True)
    bpy.ops.object.particle_system_add()
    ps = fur.particle_systems[-1]
    pset = ps.settings
    pset.material = fur.data.materials.find('FurHair')

    pset.type = 'HAIR'
    pset.count = 40000
    pset.hair_step = 4
    pset.emit_from = 'FACE'
    pset.use_even_distribution = True
    pset.distribution = 'JIT'
    # Both velocity fields are applied PER HAIR KEY. normal_factor 0.55 over
    # 4 keys pushed strands 2.2 world units off the surface; that, not
    # hair_length, is what filled the frame with fur.
    # PER-KEY WORLD UNITS. With 0.0 every strand lay flat along the surface,
    # so the legs and belly read as bare plastic while only the head's
    # curvature caught the light. A small outward push makes a real pile.
    pset.normal_factor = 0.0018
    # a small per-key droop is a comb; -0.0010 x 4 keys = 0.004 units
    pset.object_align_factor = (0.0, 0.0, -0.0010)
    # MEASURED: per-key step = hair_length/4 + 0.98 * factor_random, so total
    # strand length = 4 * step. factor_random dominated hair_length and was
    # what filled the frame with metre-long fur. Solving 4*(L/4 + 0.98f) = H
    # gives L = 0.75H, f = 0.06H for a total pile of H.
    pset.factor_random = HAIR_LEN * 0.06
    pset.child_type = 'INTERPOLATED'
    pset.child_radius = 0.02
    pset.rendered_child_count = 12
    pset.virtual_parents = 0.15
    pset.root_radius = 1.0
    pset.tip_radius = 0.0
    pset.radius_scale = 0.0009
    pset.use_advanced_hair = True
    # MUST be last: type='HAIR' resets length, and use_advanced_hair resets it
    # again. Assigned earlier it silently reads back as 2.2.
    pset.hair_length = HAIR_LEN * 0.75
    print('__HAIR_LEN__', pset.hair_length, pset.radius_scale, file=sys.stderr)

# ---------------------------------------------------------------- studio
scene = bpy.context.scene
world = bpy.data.worlds.new('Studio')
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes['Background']
bg.inputs['Color'].default_value = (0.035, 0.026, 0.020, 1.0)
bg.inputs['Strength'].default_value = 1.0


def area(name, loc, size, energy, color, target=(0, 0, 1.0)):
    d = bpy.data.lights.new(name, 'AREA')
    d.shape = 'RECTANGLE'
    d.size, d.size_y = size
    d.energy = energy
    d.color = color
    o = bpy.data.objects.new(name, d)
    scene.collection.objects.link(o)
    o.location = loc
    dirv = Vector(target) - Vector(loc)
    o.rotation_euler = dirv.to_track_quat('-Z', 'Y').to_euler()
    return o


area('Key', (2.6, -3.2, 3.4), (2.6, 2.0), 900, (1.0, 0.94, 0.86))
area('Fill', (-3.4, -2.4, 1.5), (3.2, 2.6), 260, (0.82, 0.90, 1.0))
area('Rim', (-1.6, 3.0, 3.2), (1.4, 3.0), 1100, (1.0, 0.90, 0.74))
area('Top', (0.0, 0.6, 5.2), (4.0, 4.0), 320, (1.0, 0.97, 0.94))

# ---------------------------------------------------------------- backdrop
bpy.ops.mesh.primitive_plane_add(size=26, location=(0, 4.2, 0))
bgp = bpy.context.active_object
bgp.name = 'Backdrop'
bpy.ops.object.transform_apply(location=True)
bgp.rotation_euler = (math.radians(90), 0, 0)
bgp.location = (0, 4.6, 0)
bm = bpy.data.materials.new('Backdrop')
bm.use_nodes = True
bp = principled(bm)
set_in(bp, 'Base Color', (0.055, 0.043, 0.034, 1.0))
set_in(bp, 'Roughness', 0.85)
bgp.data.materials.append(bm)

bpy.ops.mesh.primitive_plane_add(size=26, location=(0, 0, 0))
flr = bpy.context.active_object
flr.name = 'Floor'
fm = bpy.data.materials.new('Floor')
fm.use_nodes = True
fp = principled(fm)
set_in(fp, 'Base Color', (0.045, 0.035, 0.028, 1.0))
set_in(fp, 'Roughness', 0.62)
flr.data.materials.append(fm)

# ---------------------------------------------------------------- camera
if TURN:
    # stored by name: the fur join below deletes the original objects
    _r = Matrix.Rotation(math.radians(TURN), 4, 'Z')
    for _n in IMPORTED_NAMES:
        o = bpy.data.objects.get(_n)
        if o is not None and o.parent is None:
            o.matrix_world = _r @ o.matrix_world

cam_d = bpy.data.cameras.new('Cam')
cam_d.lens = 52
cam_d.sensor_width = 36
cam = bpy.data.objects.new('Cam', cam_d)
scene.collection.objects.link(cam)
scene.camera = cam
target = Vector((0.0, 0.0, 0.96))
cam.location = (1.72, -5.86, 1.34)
cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()

cam_d.dof.use_dof = True
cam_d.dof.focus_distance = (target - cam.location).length - 0.15
cam_d.dof.aperture_fstop = 4.0

# ---------------------------------------------------------------- render
scene.render.engine = 'CYCLES'
if DEVICE == 'metal':
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'
    prefs.get_devices()
    for d in prefs.devices:
        d.use = True
    scene.cycles.device = 'GPU'
else:
    scene.cycles.device = 'CPU'
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 5
scene.cycles.transmission_bounces = 4
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = 0.02
scene.render.resolution_x = W
scene.render.resolution_y = H
scene.render.resolution_percentage = 100
scene.render.film_transparent = False
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Punchy'
scene.render.filepath = OUT

print('__SUNNY__', json.dumps({
    'fur_objs': len(fur_objs), 'polys': len(fur.data.polygons),
    'parts': '' if not fur.particle_systems else fur.particle_systems[0].settings.count,
    'res': [W, H], 'samples': SAMPLES, 'hair': HAIR, 'hair_len': HAIR_LEN, 'device': DEVICE,
}))
bpy.ops.render.render(write_still=True)
print('__DONE__', OUT)
