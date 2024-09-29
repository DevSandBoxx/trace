import math
import panda3d as p3
from panda3d.core import loadPrcFile
from panda3d.core import GeomVertexReader, InternalName
from direct.actor.Actor import Actor
from direct.showbase.ShowBase import ShowBase
import math
from direct.task import Task
from cosinSim import cosSim

class MyApp(ShowBase):

    def __init__(self):
        ShowBase.__init__(self)

        # props = WindowProperties()
        # base.window.req

        # self.run_static_check("animation/pose_test/pose_structure_first.gltf", "models/BoxTextured/BoxTextured.gltf")

        self.run_animation_check('animation/BrainStem/BrainStem.gltf', 'animation/CesiumMan/CesiumMan.gltf')



    def run_animation_check(self, file1, file2):
        
        #Load two models with animations
        self.model1 = Actor(file1)
        self.model2 = Actor(file2)

        animation_name = list(self.model1.get_anim_names())[0]
        # print(self.model1.get_anim_names())

        # Reposition the camera for better visibility
        self.camera.set_pos(0, -20, 5)  # Move the camera back and slightly up
        self.camera.look_at(0, 0, 0)  # Point the camera to the origin
        
        # Scale and position the model (adjust as necessary)
        self.model1.set_scale(0.5, 0.5, 0.5)  # Adjust scale if needed
        self.model1.set_pos(0, 5, 0)  # Place at the origin
        
        # Reparent to render so it's visible in the scene
        self.model1.reparent_to(self.render)
        
        # Get the animation controls
        # anim_control1 = self.get_animation_control(model1)
        # anim_control2 = self.get_animation_control(model2)

        #play the animation
        self.model1.setPlayRate(0.5, animation_name)
        self.model1.play(animation_name)

        print(self.model1.get_lod_names())
        lod_name = list(self.model1.getLODNames())[0]

        data1 = self.get_transform_data(self.model1, lod_name)
        data2 = self.get_transform_data(self.model2, lod_name)
        
        # print(self.model1.get_joints())
        # print(self.model1.ls())

        comparison = self.compare_dynamic_data(data1, data2)

        print(comparison)
    

    def get_transform_data(self, model, lod_name):
        data = {}

        for joints in model.getJoints():
            # print(joints)
            # print(joints)
            joint_split = str(joints)
            split = joint_split.split()

            transform = model.getJointTransform(partName='modelRoot', jointName=split[1], lodName=lod_name)
            
            data[split[1]] = transform
            # print(joint_split)

        # print("Extracted Animation Data:")
        # print(data)
        return data

    def compare_dynamic_data(self, data1, data2):
        for x, y in zip(data1, data2):
            for t1, t2 in zip(data1[x], data2[y]):
                if cosSim(t1,t2) < 0.95:
                  return False
                
        return True
                

    def get_animation_data(self, actor, anim_name):
        """ Extract animation data (joint transformations) """
        data = {}

        # Loop through each joint in the Actor
        for joint_name in actor.get_joints():
            # print(joint_name)
            # Store transformations for each joint across all frames
            frame_data = []
            for frame in range(actor.get_num_frames(anim_name)):
                transform = actor.get_joint_transform(joint_name, frame, anim_name)
                frame_data.append(transform)
            
            # Store joint's animation data
            data[joint_name] = frame_data

        return data

    def get_animation_data(self, actor, anim_name):
        """ Extract animation data (joint transformations) """
        data = {}

        # Loop through each joint in the Actor
        for joint_name in actor.get_joints():
            # Store transformations for each joint across all frames
            frame_data = []
            for frame in range(actor.get_num_frames(anim_name)):
                transform = actor.get_joint_transform(joint_name, frame, anim_name)
                frame_data.append(transform)
            
            # Store joint's animation data
            data[joint_name] = frame_data

        return data

    def run_static_check(self, file1, file2):
        self.box = self.loader.loadModel(file1) # for static models
        self.boxVector = self.loader.loadModel(file2)
        # Reparent the model to render.
        self.box.reparentTo(self.render)
        self.boxVector.reparentTo(self.render)
        # Apply scale and position transforms on the model.
        self.camera.setPos(0, 0, 0)

        self.box.setScale(0.05, 0.05, 0.05)
        self.box.setPos(-1, 10, 0)

        # self.boxVector.setScale(1, 1, 1)
        # self.boxVector.setPos(self.box, 3,5,0)

        # Add the spinCameraTask procedure to the task manager.
        self.taskMgr.add(self.spinCameraTask, "SpinCameraTask")

        # self.data1 = self.getCoordinates(self.box)
        # # print(self.data1["vertices"])

        # self.data2 = self.getCoordinates(self.boxVector)
        # # print(self.data2["vertices"])

        # comparison = self.compareData(self.data1, self.data2)
        # # print(self.compareData(self.data1, self.data2))
        # print(comparison)
        # return comparison

        return 0
       

    # Define a procedure to move the camera.
    def spinCameraTask(self, task):
        angleDegrees = task.time * 6.0
        angleRadians = angleDegrees * (math.pi / 180.0)
        # 
        self.box.setHpr(angleDegrees, 0, 0)
        self.boxVector.setHpr(angleDegrees, 0 , 0)
        return Task.cont
    
    def getCoordinates(self, model):
      vertices = []
      # print(model.ls())
      data = {'vertices': [], 'normals': [], 'uvs': []}
      for geom_node in model.find_all_matches('**/+GeomNode'):
           # Iterate through all Geoms in the GeomNode
        # print(geom_node.ls())
        geom = geom_node.node().get_geom(0)
        vdata = geom.get_vertex_data()

        # Vertex reader for positions, normals, and UVs
        vertex_reader = GeomVertexReader(vdata, InternalName.get_vertex())
        normal_reader = GeomVertexReader(vdata, InternalName.get_normal())
        uv_reader = GeomVertexReader(vdata, InternalName.get_texcoord())

        # print(vdata)

       # Iterate through vertex data manually
        while not vertex_reader.is_at_end():
          # Read vertex positions
          vertex = vertex_reader.get_data3f()
          data['vertices'].append(vertex)

          # Read normals (if they exist)
          if not normal_reader.is_at_end():
              normal = normal_reader.get_data3f()
              data['normals'].append(normal)

          # Read UV coordinates (if they exist)
          if not uv_reader.is_at_end():
              uv = uv_reader.get_data2f()
              data['uvs'].append(uv)

      return data
    
    def compareData(self, data1, data2):
      
      if len(data1['vertices']) != len(data2['vertices']):
          return False

      # Compare vertex positions
      for v1, v2 in zip(data1['vertices'], data2['vertices']):
          if cosSim(v1,v2) < 0.95:
              return False

      # Compare normals
      if len(data1['normals']) == len(data2['normals']):
          for n1, n2 in zip(data1['normals'], data2['normals']):
              if cosSim(n1,n2) < 0.95:
                  return False
      else:
          return False

      # Compare UV coordinates
      if len(data1['uvs']) == len(data2['uvs']):
          for uv1, uv2 in zip(data1['uvs'], data2['uvs']):
              if cosSim(uv1,uv2) < 0.95:
                  return False
      else:
          return False

      return True
    
    def compare_floats(self, vec1, vec2, tolerance=1e-6):
        
        return all(abs(a - b) < tolerance for a, b in zip(vec1, vec2))

    

def main():

  loadPrcFile("config/config.prc")

  app = MyApp()
  app.run() 

  return 0

if __name__ == "__main__":
  main()