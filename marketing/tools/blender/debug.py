import bpy, sys, json

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
glb = argv[0] if argv else 'studio/pup/sunny.glb'

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)

meshes = [o for o in bpy.data.objects if o.type == 'MESH']
for o in list(meshes):
    if len(o.data.polygons) <= 4:
        bpy.data.objects.remove(o, do_unlink=True)
meshes = [o for o in bpy.data.objects if o.type == 'MESH']

FUR_MATS = {'Material_0', 'Material_1', 'Material_2', 'Material_4', 'Material_5'}
fur = [o for o in meshes if any(m and m.name in FUR_MATS for m in o.data.materials)]

bpy.ops.object.select_all(action='DESELECT')
for o in fur:
    o.select_set(True)
bpy.context.view_layer.objects.active = fur[0]
print('__BEFORE__', json.dumps({
    'n': len(fur),
    'active_scale': list(fur[0].scale),
    'active_loc': list(fur[0].location),
    'active_dims': list(fur[0].dimensions),
}))

bpy.ops.object.join()
body = bpy.context.view_layer.objects.active
print('__JOINED__', json.dumps({
    'scale': list(body.scale),
    'loc': list(body.location),
    'dims': list(body.dimensions),
    'matrix_world_diag': [body.matrix_world[i][i] for i in range(4)],
}))

bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
print('__APPLIED__', json.dumps({
    'scale': list(body.scale),
    'loc': list(body.location),
    'dims': list(body.dimensions),
}))

# world-space bounds of everything that will render
import mathutils
mn = mathutils.Vector((1e9, 1e9, 1e9))
mx = mathutils.Vector((-1e9, -1e9, -1e9))
for o in bpy.data.objects:
    if o.type != 'MESH':
        continue
    for c in o.bound_box:
        w = o.matrix_world @ mathutils.Vector(c)
        for i in range(3):
            mn[i] = min(mn[i], w[i]); mx[i] = max(mx[i], w[i])
print('__BOUNDS__', json.dumps({'min': list(mn), 'max': list(mx)}))

# is Metal available?
prefs = bpy.context.preferences.addons.get('cycles')
print('__CYCLES__', json.dumps({
    'has_cycles': prefs is not None,
    'devices': [d.name for d in bpy.context.preferences.addons['cycles'].preferences.devices] if prefs else [],
}))
