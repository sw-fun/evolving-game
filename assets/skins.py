
# Skins: surfaces that look like what they are. A texture is a picture
# baked from Blender's own nodes (courses of stone, boards, a grain)
# on a square a meter wide, so that it can be laid edge to edge; a part
# is skinned by laying that picture over each of its faces at the
# world's scale, whatever the part's size, so a wall's stones are the
# size of a gate post's. X_eTaL says which textures there are and which
# part wears which (assets/Castle.xtl); this file is how Blender makes
# them, included in the script after bp:head.
skins = {}

def texture(name, kind, a, b, c, cells, rough, size):
    """kind: bricks (courses of blocks a and b, mortar c, cells courses a
    meter), boards (boards a and b across, gaps c, cells boards a meter),
    grain (a and b mixed by noise, cells its scale)."""
    bpy.ops.mesh.primitive_plane_add(size=1.0)
    square = bpy.context.active_object
    src = bpy.data.materials.new(name + " source")
    src.use_nodes = True
    nt = src.node_tree
    shader = nt.nodes["Principled BSDF"]
    where = nt.nodes.new("ShaderNodeTexCoord")
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 9.0
    noise.inputs["Detail"].default_value = 6.0
    nt.links.new(where.outputs["UV"], noise.inputs["Vector"])
    if kind == "grain":
        ramp = nt.nodes.new("ShaderNodeMixRGB")
        noise.inputs["Scale"].default_value = cells
        ramp.inputs["Color1"].default_value = a + (1.0,)
        ramp.inputs["Color2"].default_value = b + (1.0,)
        nt.links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
        color, height = ramp.outputs["Color"], noise.outputs["Fac"]
    else:
        laid = nt.nodes.new("ShaderNodeTexBrick")
        laid.inputs["Color1"].default_value = a + (1.0,)
        laid.inputs["Color2"].default_value = b + (1.0,)
        laid.inputs["Mortar"].default_value = c + (1.0,)
        laid.inputs["Scale"].default_value = 1.0
        laid.inputs["Bias"].default_value = 0.0
        if kind == "bricks":
            laid.offset = 0.5
            laid.inputs["Brick Width"].default_value = 2.0 / cells
            laid.inputs["Row Height"].default_value = 1.0 / cells
            laid.inputs["Mortar Size"].default_value = 0.018
        else:
            laid.offset = 0.0
            laid.inputs["Brick Width"].default_value = 1.0 / cells
            laid.inputs["Row Height"].default_value = 1.0
            laid.inputs["Mortar Size"].default_value = 0.008
        laid.inputs["Mortar Smooth"].default_value = 0.2
        nt.links.new(where.outputs["UV"], laid.inputs["Vector"])
        # each stone or board a little lighter or darker in places
        worn = nt.nodes.new("ShaderNodeMixRGB")
        worn.blend_type = "MULTIPLY"
        worn.inputs["Fac"].default_value = 0.45
        nt.links.new(laid.outputs["Color"], worn.inputs["Color1"])
        nt.links.new(noise.outputs["Color"], worn.inputs["Color2"])
        lift = nt.nodes.new("ShaderNodeMixRGB")
        lift.blend_type = "ADD"
        lift.inputs["Fac"].default_value = 0.22
        lift.inputs["Color2"].default_value = (1.0, 1.0, 1.0, 1.0)
        nt.links.new(worn.outputs["Color"], lift.inputs["Color1"])
        color, height = lift.outputs["Color"], laid.outputs["Fac"]
    nt.links.new(color, shader.inputs["Base Color"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.invert = kind != "grain"
    bump.inputs["Strength"].default_value = 0.6
    nt.links.new(height, bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], shader.inputs["Normal"])
    square.data.materials.append(src)
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 8
    bpy.ops.object.select_all(action="DESELECT")
    square.select_set(True)
    bpy.context.view_layer.objects.active = square
    pictures = {}
    for what in ("DIFFUSE", "NORMAL"):
        img = bpy.data.images.new(name + (" color" if what == "DIFFUSE" else " normal"), size, size)
        if what == "NORMAL":
            img.colorspace_settings.name = "Non-Color"
        node = nt.nodes.new("ShaderNodeTexImage")
        node.image = img
        nt.nodes.active = node
        if what == "DIFFUSE":
            bpy.ops.object.bake(type="DIFFUSE", pass_filter={"COLOR"}, margin=0)
        else:
            bpy.ops.object.bake(type="NORMAL", margin=0)
        img.pack()
        pictures[what] = img
    bpy.data.objects.remove(square)
    worn = bpy.data.materials.new(name)
    worn.use_nodes = True
    nt = worn.node_tree
    shader = nt.nodes["Principled BSDF"]
    shader.inputs["Roughness"].default_value = rough
    tint = nt.nodes.new("ShaderNodeTexImage")
    tint.image = pictures["DIFFUSE"]
    nt.links.new(tint.outputs["Color"], shader.inputs["Base Color"])
    relief = nt.nodes.new("ShaderNodeTexImage")
    relief.image = pictures["NORMAL"]
    tangent = nt.nodes.new("ShaderNodeNormalMap")
    nt.links.new(relief.outputs["Color"], tangent.inputs["Color"])
    nt.links.new(tangent.outputs["Normal"], shader.inputs["Normal"])
    skins[name] = worn

def skin(part, name, turned=False):
    """Lay the texture NAME over the part: each face takes the picture
    along its own two directions, a meter of the world to a picture;
    turned lays it the other way round (boards along, not across)."""
    o = bpy.data.objects[part]
    me = o.data
    layer = me.uv_layers.active or me.uv_layers.new(name="skin")
    sx, sy, sz = o.scale
    for poly in me.polygons:
        n = poly.normal
        axis = max(range(3), key=lambda i: abs(n[i]))
        for li in poly.loop_indices:
            co = me.vertices[me.loops[li].vertex_index].co
            x, y, z = co[0] * sx, co[1] * sy, co[2] * sz
            u, v = ((y, z) if axis == 0 else (x, z) if axis == 1 else (x, y))
            layer.data[li].uv = (v, u) if turned else (u, v)
    me.materials.clear()
    me.materials.append(skins[name])
