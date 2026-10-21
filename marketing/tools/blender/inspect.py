import bpy, sys, json, os

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=sys.argv[sys.argv.index('--') + 1])

out = {"objects": [], "materials": [], "bounds": None}
lo = [1e9] * 3
hi = [-1e9] * 3

for o in bpy.data.objects:
    rec = {
        "name": o.name,
        "type": o.type,
        "parent": o.parent.name if o.parent else None,
        "loc": [round(v, 4) for v in o.location],
        "scale": [round(v, 4) for v in o.scale],
    }
    if o.type == 'MESH':
        me = o.data
        rec["verts"] = len(me.vertices)
        rec["polys"] = len(me.polygons)
        rec["mats"] = [m.name if m else None for m in me.materials]
        rec["color_attrs"] = [a.name for a in me.color_attributes]
        rec["uv"] = [u.name for u in me.uv_layers]
        for v in o.bound_box:
            w = o.matrix_world @ __import__('mathutils').Vector(v)
            for i in range(3):
                lo[i] = min(lo[i], w[i])
                hi[i] = max(hi[i], w[i])
    out["objects"].append(rec)

for m in bpy.data.materials:
    rec = {"name": m.name, "use_nodes": m.use_nodes, "nodes": []}
    if m.use_nodes:
        for n in m.node_tree.nodes:
            if n.type == 'BSDF_PRINCIPLED':
                rec["nodes"].append({
                    "type": n.type,
                    "base": [round(x, 3) for x in n.inputs['Base Color'].default_value],
                    "rough": round(n.inputs['Roughness'].default_value, 3),
                    "metal": round(n.inputs['Metallic'].default_value, 3),
                })
            else:
                rec["nodes"].append({"type": n.type})
    out["materials"].append(rec)

out["bounds"] = {"min": [round(v, 3) for v in lo], "max": [round(v, 3) for v in hi]}
mesh = [o for o in bpy.data.objects if o.type == 'MESH']
out["mesh_count"] = len(mesh)
out["total_polys"] = sum(len(o.data.polygons) for o in mesh)

print("__JSON__" + json.dumps(out, indent=1))
