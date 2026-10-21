import bpy, sys
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
glb = argv[0] if argv else 'studio/pup/sunny2.glb'
FUR_MATS = {'Material_0','Material_1','Material_2','Material_4','Material_5'}
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
for o in list(bpy.data.objects):
    if o.type=='MESH' and len(o.data.polygons)<=4:
        bpy.data.objects.remove(o, do_unlink=True)
fur_objs=[o for o in bpy.data.objects if o.type=='MESH' and FUR_MATS & {m.name for m in o.data.materials}]
for o in bpy.data.objects: o.select_set(False)
for o in fur_objs: o.select_set(True)
bpy.context.view_layer.objects.active=fur_objs[0]
bpy.ops.object.join()
fur=bpy.context.view_layer.objects.active
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
print('__DIMS__',tuple(round(v,4) for v in fur.dimensions),'verts',len(fur.data.vertices))
bpy.ops.object.particle_system_add()
ps=fur.particle_systems[0].settings
ps.type='HAIR'; ps.count=300; ps.hair_step=4; ps.emit_from='FACE'
ps.use_even_distribution=True; ps.distribution='JIT'
ps.normal_factor=0.0018
ps.object_align_factor=(0.0,0.0,-0.0010)
ps.factor_random=0.017*0.06
ps.child_type='INTERPOLATED'; ps.child_radius=0.012; ps.rendered_child_count=6
ps.virtual_parents=0.15; ps.root_radius=1.0; ps.tip_radius=0.0
ps.radius_scale=0.0012; ps.use_advanced_hair=True
ps.hair_length=0.017*0.75
bpy.context.view_layer.update()
dg=bpy.context.evaluated_depsgraph_get()
ev=fur.evaluated_get(dg)
pse=ev.particle_systems[0]
import statistics
lens=[]
for pa in pse.particles:
    ks=pa.hair_keys
    if len(ks)<2: continue
    pts=[ev.matrix_world @ k.co for k in ks]
    lens.append(sum((pts[i+1]-pts[i]).length for i in range(len(pts)-1)))
print('__LEN__ n',len(lens),'mean',round(statistics.mean(lens),5),'p90',round(sorted(lens)[int(len(lens)*0.9)],5),'max',round(max(lens),5))
