import bpy, sys
from mathutils import Vector

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='studio/pup/sunny.glb')

FUR_MATS = {'Material_0','Material_1','Material_2','Material_4','Material_5'}
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and len(o.data.polygons) > 4]
fur_objs = [o for o in meshes if FUR_MATS & {m.name for m in o.data.materials if m}]
bpy.ops.object.select_all(action='DESELECT')
for o in fur_objs: o.select_set(True)
bpy.context.view_layer.objects.active = fur_objs[0]
bpy.ops.object.join()
fur = bpy.context.view_layer.objects.active
print('__PRE__', tuple(round(v,4) for v in fur.scale), tuple(round(v,4) for v in fur.dimensions))
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
print('__POST__', tuple(round(v,4) for v in fur.scale), tuple(round(v,4) for v in fur.dimensions))

bpy.ops.object.particle_system_add()
ps = fur.particle_systems[-1]
s = ps.settings
s.type='HAIR'
print('__AFTER_TYPE__', s.type, 'hair_len', s.hair_length)
s.count=200
s.hair_step=3
s.emit_from='FACE'; s.normal_factor=0.55; s.object_align_factor=(0,0,0.0)
s.child_type='INTERPOLATED'; s.rendered_child_count=3; s.radius_scale=0.0012
s.use_advanced_hair=True
print('__BEFORE_LAST__', s.hair_length)
s.hair_length=0.05
print('__SET__', s.hair_length)
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
fur_ev = fur.evaluated_get(dg)
ps_ev = fur_ev.particle_systems[0]
print('__CUR__', ps.settings.hair_length, 'ev', ps_ev.settings.hair_length)
print('__COUNT__', len(ps_ev.particles), 'hair_length', ps_ev.settings.hair_length,
      'child_len', ps_ev.settings.child_length, 'normal_factor', ps_ev.settings.normal_factor)
p = ps_ev.particles[0]
keys = [Vector(k.co) for k in p.hair_keys]
L = sum((keys[i+1]-keys[i]).length for i in range(len(keys)-1))
print('__STRAND__ local_len=%.5f root=%s tip=%s' % (L, tuple(round(v,4) for v in keys[0]), tuple(round(v,4) for v in keys[-1])))
print('__OBJ__ scale=%s matrix_world_scale=%s' % (tuple(round(v,4) for v in fur.scale), tuple(round(v,4) for v in fur.matrix_world.to_scale())))
