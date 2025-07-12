# Blender GLB Export Guide for Web Animation

## 🎬 **Animation Export Settings**

### 1. **Animation Settings in Blender**

- **Frame Rate**: Set to 30 FPS (not 24) for smoother web playback
- **Animation Length**: Keep animations under 3-5 seconds for web performance
- **Keyframe Interpolation**: Use "Linear" or "Bezier" (avoid "Constant")

### 2. **Export Settings (File > Export > glTF 2.0 (.glb/.gltf))**

#### **Format Tab:**

- ✅ **Format**: glTF Binary (.glb)
- ✅ **Include Selected Objects**: Uncheck (export entire scene)
- ✅ **Include Custom Properties**: Check

#### **Geometry Tab:**

- ✅ **Apply Modifiers**: Check
- ✅ **UVs**: Check
- ✅ **Normals**: Check
- ✅ **Tangents**: Check
- ✅ **Vertex Colors**: Check (if used)
- ✅ **Materials**: Check
- ✅ **Compression**: Check (Draco compression)

#### **Animation Tab:**

- ✅ **Animation**: Check
- ✅ **Always Sample Animations**: Check (IMPORTANT!)
- ✅ **Group by NLA Track**: Uncheck
- ✅ **Include All Bone Influences**: Check
- ✅ **Include Custom Properties**: Check

#### **Armature Tab:**

- ✅ **Deformation Bones Only**: Check
- ✅ **Export Bone Groups**: Uncheck
- ✅ **Add Leaf Bones**: Uncheck

## 🚀 **Performance Optimizations**

### 1. **Model Optimization**

- **Reduce Polygon Count**: Aim for under 10,000 triangles for web
- **Simplify Materials**: Use fewer materials and textures
- **Optimize Textures**: Keep textures under 1024x1024 pixels
- **Remove Unused Objects**: Delete hidden or unused geometry

### 2. **Animation Optimization**

- **Reduce Keyframes**: Use fewer keyframes, let interpolation handle smoothness
- **Simplify Rig**: Use fewer bones if possible
- **Bake Animation**: If using complex modifiers, bake them to keyframes

### 3. **Export Size Optimization**

- **Enable Compression**: Use Draco compression in export
- **Reduce Texture Quality**: If needed, lower texture resolution
- **Remove Unused Data**: Clean up unused materials, textures, etc.

## 🔧 **Troubleshooting**

### **Animation Not Playing:**

1. Check "Always Sample Animations" is enabled
2. Ensure animation has keyframes (not just modifiers)
3. Verify animation is not on hidden layers
4. Check animation length is reasonable (1-5 seconds)

### **Poor Performance:**

1. Reduce polygon count
2. Simplify materials and textures
3. Use fewer bones in armature
4. Enable Draco compression
5. Reduce animation complexity

### **Material Issues:**

1. Use Principled BSDF shader
2. Avoid complex node setups
3. Bake textures if using procedural materials
4. Ensure materials are assigned to visible objects

## 📋 **Recommended Export Checklist**

- [ ] Animation is under 5 seconds
- [ ] Frame rate set to 30 FPS
- [ ] "Always Sample Animations" is checked
- [ ] Draco compression is enabled
- [ ] Polygon count is under 10,000
- [ ] Textures are under 1024x1024
- [ ] No unused objects or materials
- [ ] Materials use Principled BSDF
- [ ] Animation has proper keyframes

## 🎯 **Quick Fix for Current Model**

If your current model is slow and laggy:

1. **In Blender:**

   - Reduce polygon count (Decimate modifier)
   - Simplify materials (use basic Principled BSDF)
   - Reduce animation length to 2-3 seconds
   - Bake complex materials to textures

2. **Re-export with:**

   - "Always Sample Animations" checked
   - Draco compression enabled
   - Frame rate at 30 FPS

3. **Test the new export** - it should be much smoother!
