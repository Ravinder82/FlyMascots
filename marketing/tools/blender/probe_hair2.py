import bpy, sys, math
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
glb = argv[0] if argv else 'studio/pup/sunny.glb'

FUR_MATS = {'Material_0', 'Material_1', 'Material_2', 'Material_4', 'Material_5'}

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)

for o in list(bpy.data.objects):
    if o.type == 'MESH' and len(o.data.polygons) <= 4:
        bpy.data.objects.remove(o, do_unlink=True)

fur_objs = [o for o in bpy.data.objects
            if o.type == 'MESH' and FUR_MATS & {m.name for m in o.data.materials}]
for o in bpy.data.objects:
    o.select_set(False)
for o in fur_objs:
    o.select_set(True)
bpy.context.view_layer.objects.active = fur_objs[0]
bpy.ops.object.join()
fur = bpy.context.view_layer.objects.active
fur.name = 'FurBody'
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

print('__FUR__ scale', tuple(round(v, 4) for v in fur.scale),
      'dims', tuple(round(v, 4) for v in fur.dimensions))

bpy.ops.object.particle_system_add()
pset = fur.particle_systems[0].settings
pset.type = 'HAIR'
pset.count = 400
pset.hair_step = 4
pset.emit_from = 'FACE'
pset.use_even_distribution = True
pset.distribution = 'JIT'
pset.factor_random = 0.045 / 6.8
pset.child_type = 'INTERPOLATED'
pset.child_radius = 0.012
pset.rendered_child_count = 6
pset.virtual_parents = 0.15
pset.root_radius = 1.0
pset.tip_radius = 0.0
pset.radius_scale = 0.0012
pset.use_advanced_hair = True
pset.normal_factor = 0.0
pset.object_align_factor = (0.0, 0.0, -0.012)
pset.hair_length = 0.045

dg = bpy.context.evaluated_depsgraph_get()
ev = fur.evaluated_get(dg)
ps = ev.particle_systems[0]

lens = []
for p in ps.particles:
    ks = p.hair_keys
    if len(ks) < 2:
        continue
    lens.append((ks[-1].co - ks[0].co).length)

print('__SETTINGS__ hair_length', round(pset.hair_length, 5),
      'normal_factor', pset.normal_factor,
      'object_align', tuple(round(v, 4) for v in pset.object_align_factor),
      'hair_step', pset.hair_step,
      'advanced', pset.use_advanced_hair,
      'count', pset.count,
      'children', pset.rendered_child_count)

p0 = ps.particles[0]
ks = p0.hair_keys
print('__KEYS__ n', len(ks))
prev = None
for i, k in enumerate(ks[:12]):
    d = ''
    if prev is not None:
        d = round((k.co - prev).length, 5)
    print('__KEY__', i, tuple(round(v, 4) for v in k.co), 'step', d)
    prev = k.co

if lens:
    lens.sort()
    print('__STRAND__ n', len(lens),
          'min', round(lens[0], 5),
          'median', round(lens[len(lens)//2], 5),
          'max', round(lens[-1], 5))
else:
    print('__STRAND__ none')

# how far do the tips stray from the mesh bounds?
bb = [fur.matrix_world @ Vector(c) for c in fur.bound_box]
lo = Vector((min(v.x for v in bb), min(v.y for v in bb), min(v.z for v in bb)))
hi = Vector((max(v.x for v in bb), max(v.y for v in bb), max(v.z for v in bb)))
print('__BBOX__ lo', tuple(round(v, 3) for v in lo), 'hi', tuple(round(v, 3) for v in hi))
