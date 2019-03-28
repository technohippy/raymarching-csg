precision highp float;

uniform vec2 resolution;

uniform mat4 viewMatrix;
uniform vec3 cameraPosition;

uniform mat4 cameraWorldMatrix;
uniform mat4 cameraProjectionMatrixInverse;

uniform vec3 spherePosition;
uniform vec3 sphereRotation;
uniform float sphereScale;
uniform vec3 cubePosition;
uniform vec3 cubeRotation;
uniform float cubeScale;
uniform vec3 cylinderPosition;
uniform vec3 cylinderRotation;
uniform float cylinderScale;

uniform vec3 va[3];

const float EPS = 0.001;
const float OFFSET = EPS * 100.0;
const vec3 light1Dir = normalize(vec3(0.5, 1, 0.8));
const vec3 light2Dir = -light1Dir;

// CSG
float intersect(float dist1, float dist2) {
  return max(dist1, dist2);
}

float unite(float dist1, float dist2) {
  return min(dist1, dist2);
}

float differ(float dist1, float dist2) {
  return max(dist1, -dist2);
}

// transform
vec3 translate(vec3 p, vec3 v) {
  return p - v;
}

vec3 rotateOnAxis(vec3 p, vec3 c, vec3 deg) {
  float x = radians(deg.x);
  float y = radians(deg.y);
  float z = radians(deg.z);
  mat3 m = mat3(
    cos(z)*cos(x) - sin(z)*cos(y)*sin(x),
    cos(z)*sin(x) + sin(z)*cos(y)*cos(x),
    sin(z)*sin(y),

    -sin(z)*cos(x) - cos(z)*cos(y)*sin(x),
    -sin(z)*sin(x) + cos(z)*cos(y)*cos(x),
    cos(z)*sin(y),

    sin(y)*sin(x),
    -sin(y)*cos(x),
    cos(y)
  );
  return (m * (p - c)) + c;
}

vec3 rotate(vec3 p, vec3 rad) {
  float x = rad.x;
  float y = rad.y;
  float z = rad.z;
  mat3 m = mat3(
    cos(y)*cos(z),
    sin(x)*sin(y)*cos(z) - cos(x)*sin(z),
    cos(x)*sin(y)*cos(z) + sin(x)*sin(z),

    cos(y)*sin(z),
    sin(x)*sin(y)*sin(z) + cos(x)*cos(z),
    cos(x)*sin(y)*sin(z) - sin(x)*cos(z),

    -sin(y),
    sin(x)*cos(y),
    cos(x)*cos(y)
  );
  return m * p;
}

// basic distance functions
// http://iquilezles.org/www/articles/distfunctions/distfunctions.htm
float sphereDist(vec3 p, float r) {
  return length(p) - r;
}

float boxDist(vec3 p, vec3 size) {
  vec3 d = abs(p) - size / 2.0;
  return length(max(d,0.0)) + min(max(d.x,max(d.y,d.z)),0.0);
}

float cylinderDist(vec3 p, float radius, float height) {
  vec2 d = vec2( length(p.xz)-radius, abs(p.y) - height / 2.0);
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

// distance function
float distance(vec3 p) {
  float cube = boxDist(rotate(translate(p, cubePosition), cubeRotation), vec3(cubeScale * 2., cubeScale * 2., cubeScale * 2.));
  float cylinder = cylinderDist(rotate(translate(p, cylinderPosition), cylinderRotation), cylinderScale * 0.5, cylinderScale * 4.0);
  float sphere = sphereDist(translate(p, spherePosition), sphereScale * 1. * va[0][0]);
  return differ(unite(cube, cylinder), sphere);
}

float sceneDist(vec3 p) {
  return distance(p);
}

// color
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec4 sceneColor(vec3 p) {
  // 3 * 6 / 2 = 9
  return vec4(hsv2rgb(vec3((p.z + p.x) / 9.0, 1.0, 1.0)), distance(p));
}

vec3 getNormal(vec3 p) {
  return normalize(vec3(
    sceneDist(p + vec3(EPS, 0.0, 0.0)) - sceneDist(p + vec3(-EPS, 0.0, 0.0)),
    sceneDist(p + vec3(0.0, EPS, 0.0)) - sceneDist(p + vec3(0.0, -EPS, 0.0)),
    sceneDist(p + vec3(0.0, 0.0, EPS)) - sceneDist(p + vec3(0.0, 0.0, -EPS))
 ));
}

float getShadow(vec3 ro, vec3 rd) {
  float h = 0.0;
  float c = 0.0;
  float r = 1.0;
  float shadowCoef = 0.5;

  for (float t = 0.0; t < 50.0; t++) {
    h = sceneDist(ro + rd * c);
    if (h < EPS) return shadowCoef;
    r = min(r, h * 16.0 / c);
    c += h;
  }
  return 1.0 - shadowCoef + r * shadowCoef;
}

vec3 getLightColor(vec3 lightDir, vec3 ray, vec3 pos, vec3 normal) {
  float diffuse = clamp(dot(lightDir, normal), 0.1, 1.0);
  float specular = pow(clamp(dot(reflect(lightDir, normal), ray), 0.0, 1.0), 10.0);
  float shadow = getShadow(pos + normal * OFFSET, lightDir);
  return (sceneColor(pos).rgb * diffuse + vec3(0.8) * specular) * max(0.5, shadow);
}

vec3 getRayColor(vec3 origin, vec3 ray, out vec3 pos, out vec3 normal, out bool hit) {
  // marching loop
  float dist;
  float depth = 0.0;
  pos = origin;

  for (int i = 0; i < 64; i++){
    dist = sceneDist(pos);
    depth += dist;
    pos = origin + depth * ray;

    if (abs(dist) < EPS) break;
  }

  // hit check and calc color
  vec3 color;

  if (abs(dist) < EPS) {

    normal = getNormal(pos);
    color = getLightColor(light1Dir, ray, pos, normal) + getLightColor(light2Dir, ray, pos, normal);

    hit = true;

  } else {

    color = vec3(0.0);

  }

  return color - pow(clamp(0.05 * depth, 0.0, 0.6), 2.0);

}

// 
void main(void) {
  // screen position
  vec2 screenPos = (gl_FragCoord.xy * 2.0 - resolution) / resolution;

  // ray direction in normalized device coordinate
  vec4 ndcRay = vec4(screenPos.xy, 1.0, 1.0);

  // convert ray direction from normalized device coordinate to world coordinate
  vec3 ray = (cameraWorldMatrix * cameraProjectionMatrixInverse * ndcRay).xyz;
  ray = normalize(ray);

  // camera position
  vec3 cPos = cameraPosition;

  // cast ray
  vec3 color = vec3(0.0);
  vec3 pos, normal;
  bool hit;
  float alpha = 1.0;

  for (int i = 0; i < 3; i++) {
    color += alpha * getRayColor(cPos, ray, pos, normal, hit);
    alpha *= 0.3;
    ray = normalize(reflect(ray, normal));
    cPos = pos + normal * OFFSET;

    if (!hit) break;
  }
  gl_FragColor = vec4(color, 1.0);
}
