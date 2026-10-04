#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform vec2 uRes;
uniform vec2 uResCss;
uniform float uTime;
uniform sampler2D uBg;
uniform vec2 uTexSize;
uniform float uImageAR;
uniform float uBlur;
uniform float uStaticDrops;
uniform float uRollingDrops;
uniform float uSpeed;
uniform float uDistortion;
uniform float uDim;

#define RandomSeed 4.3315
#define RaindropBlur 0.0
#define StaticRaindropUVScale 20.0
#define RollingRaindropUVScaleLayer01 2.25
#define RollingRaindropUVScaleLayer02 2.25
#define ReferenceScreenHeight 900.0

vec3 bgLod(vec2 uv, float lod) {
    float screenAR = uRes.x / uRes.y;
    vec2 q = uv;
    if (screenAR > uImageAR) {
        q.y = (q.y - 0.5) * (uImageAR / screenAR) + 0.5;
    } else {
        q.x = (q.x - 0.5) * (screenAR / uImageAR) + 0.5;
    }

    return textureLod(uBg, clamp(q, vec2(0.0015), vec2(0.9985)), lod).rgb;
}

vec3 bg(vec2 uv) {
    return bgLod(uv, 0.0);
}

vec3 blurScene(vec2 uv, vec2 refr, float blurAmt) {
    if (blurAmt <= 0.001) return bg(uv + refr);

    vec2 px = 1.0 / uRes;
    float s = mix(1.5, 28.0, clamp(blurAmt / 4.0, 0.0, 1.0));
    vec3 c = vec3(0.0);
#ifdef LOW_QUALITY
    c += bg(uv + refr) * 0.36;
    c += bg(uv + refr + vec2( s, 0.0) * px) * 0.16;
    c += bg(uv + refr + vec2(-s, 0.0) * px) * 0.16;
    c += bg(uv + refr + vec2(0.0,  s) * px) * 0.16;
    c += bg(uv + refr + vec2(0.0, -s) * px) * 0.16;
    return c;
#else
    c += bg(uv + refr) * 0.18;
    c += bg(uv + refr + vec2( s, 0.0) * px) * 0.10;
    c += bg(uv + refr + vec2(-s, 0.0) * px) * 0.10;
    c += bg(uv + refr + vec2(0.0,  s) * px) * 0.10;
    c += bg(uv + refr + vec2(0.0, -s) * px) * 0.10;
    c += bg(uv + refr + vec2( 0.7*s,  0.7*s) * px) * 0.085;
    c += bg(uv + refr + vec2(-0.7*s,  0.7*s) * px) * 0.085;
    c += bg(uv + refr + vec2( 0.7*s, -0.7*s) * px) * 0.085;
    c += bg(uv + refr + vec2(-0.7*s, -0.7*s) * px) * 0.085;
    c += bg(uv + refr + vec2( 1.7*s, 0.0) * px) * 0.035;
    c += bg(uv + refr + vec2(-1.7*s, 0.0) * px) * 0.035;
    c += bg(uv + refr + vec2(0.0,  1.7*s) * px) * 0.035;
    c += bg(uv + refr + vec2(0.0, -1.7*s) * px) * 0.035;
    return c;
#endif
}

#ifdef LOW_QUALITY
float lqHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

vec4 os2NoiseWithDerivatives_ImproveXY(vec3 X) {
    vec2 i = floor(X.xy);
    vec2 f = fract(X.xy);
    vec2 w = f * f * (3.0 - 2.0 * f);
    float a = lqHash(i);
    float b = lqHash(i + vec2(1.0, 0.0));
    float c = lqHash(i + vec2(0.0, 1.0));
    float d = lqHash(i + vec2(1.0, 1.0));
    float n = mix(mix(a, b, w.x), mix(c, d, w.x), w.y) * 2.0 - 1.0;
    return vec4(0.0, 0.0, 0.0, n);
}
#else
vec4 permute(vec4 t) {
    return t * (t * 34.0 + 133.0);
}

vec3 grad(float hash) {
    vec3 cube = mod(floor(hash / vec3(1.0, 2.0, 4.0)), 2.0) * 2.0 - 1.0;
    vec3 cuboct = cube;
    if (hash < 16.0) cuboct.x = 0.0;
    else if (hash < 32.0) cuboct.y = 0.0;
    else cuboct.z = 0.0;
    float type = mod(floor(hash / 8.0), 2.0);
    vec3 rhomb = (1.0 - type) * cube + type * (cuboct + cross(cube, cuboct));
    vec3 g = cuboct * 1.22474487139 + rhomb;
    g *= (1.0 - 0.042942436724648037 * type) * 3.5946317686139184;
    return g;
}

vec4 os2NoiseWithDerivativesPart(vec3 X) {
    vec3 b = floor(X);
    vec4 i4 = vec4(X - b, 2.5);
    vec3 v1 = b + floor(dot(i4, vec4(.25)));
    vec3 v2 = b + vec3(1, 0, 0) + vec3(-1, 1, 1) * floor(dot(i4, vec4(-.25, .25, .25, .35)));
    vec3 v3 = b + vec3(0, 1, 0) + vec3(1, -1, 1) * floor(dot(i4, vec4(.25, -.25, .25, .35)));
    vec3 v4 = b + vec3(0, 0, 1) + vec3(1, 1, -1) * floor(dot(i4, vec4(.25, .25, -.25, .35)));

    vec4 hashes = permute(mod(vec4(v1.x, v2.x, v3.x, v4.x), 289.0));
    hashes = permute(mod(hashes + vec4(v1.y, v2.y, v3.y, v4.y), 289.0));
    hashes = mod(permute(mod(hashes + vec4(v1.z, v2.z, v3.z, v4.z), 289.0)), 48.0);

    vec3 d1 = X - v1; vec3 d2 = X - v2; vec3 d3 = X - v3; vec3 d4 = X - v4;
    vec4 a = max(0.75 - vec4(dot(d1, d1), dot(d2, d2), dot(d3, d3), dot(d4, d4)), 0.0);
    vec4 aa = a * a; vec4 aaaa = aa * aa;
    vec3 g1 = grad(hashes.x); vec3 g2 = grad(hashes.y);
    vec3 g3 = grad(hashes.z); vec3 g4 = grad(hashes.w);
    vec4 extrapolations = vec4(dot(d1, g1), dot(d2, g2), dot(d3, g3), dot(d4, g4));

    vec3 derivative =
        -8.0 * (d1 * (aa.x * a.x * extrapolations.x)
              + d2 * (aa.y * a.y * extrapolations.y)
              + d3 * (aa.z * a.z * extrapolations.z)
              + d4 * (aa.w * a.w * extrapolations.w))
        + g1 * aaaa.x + g2 * aaaa.y + g3 * aaaa.z + g4 * aaaa.w;

    return vec4(derivative, dot(aaaa, extrapolations));
}

vec4 os2NoiseWithDerivatives_ImproveXY(vec3 X) {
    mat3 orthonormalMap = mat3(
        0.788675134594813, -0.211324865405187, -0.577350269189626,
        -0.211324865405187, 0.788675134594813, -0.577350269189626,
        0.577350269189626, 0.577350269189626, 0.577350269189626);
    X = orthonormalMap * X;
    vec4 result = os2NoiseWithDerivativesPart(X);
    return vec4(result.xyz * orthonormalMap, result.w);
}
#endif

float GradientWave(float b, float t) {
    return smoothstep(0., b, t) * smoothstep(1., b, t);
}

float Random(vec2 UV, float Seed) {
    return fract(sin(dot(UV.xy * 13.235, vec2(12.9898, 78.233)) * 0.000001) * 43758.5453123 * Seed);
}

vec3 RandomVec3Func(vec2 UV, float Seed) {
    return vec3(Random(UV, Seed), Random(UV * 2.0, Seed), Random(UV * 3.0, Seed));
}

float MapToRange(float edge0, float edge1, float x) {
    return clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
}

float ProportionalMapToRange(float edge0, float edge1, float x) {
    return edge0 + (edge1 - edge0) * x;
}

vec3 RaindropSurface(vec2 XY, float DistanceScale, float ZScale) {
    float A = DistanceScale;
    float x = XY.x;
    float y = XY.y;
    float N = 1.5;
    float M = 0.5;
    float S = ZScale;

    float TempZ = 1.0 - pow(x / A, 2.0) - pow(y / A, 2.0);
    TempZ = max(TempZ, 0.0);
    float Z = pow(TempZ, A / 2.0);
    float ZInMAndN = (Z - M) / (N - M);
    float t = clamp(ZInMAndN, 0.0, 1.0);

    float Height = S * t * t * (3.0 - 2.0 * t);
    float Part01 = S * (6.0 * t - 8.0 * t * t);
    float Part02 = 1.0 / (N - M);
    float Part03 = TempZ > 0.0 ? (-1.0 / A * pow(TempZ, A / 2.0 - 1.0)) : 0.0;

    float TempValue = (ZInMAndN > 0.0 && ZInMAndN < 1.0) ? Part01 * Part02 : 0.0;
    float PartialDerivativeX = TempValue * x * Part03;
    float PartialDerivativeY = TempValue * y * Part03;
    vec2 PartialDerivative = Height > 0.0 ? vec2(PartialDerivativeX, PartialDerivativeY) : vec2(0.0, 0.0);
    return vec3(Height, PartialDerivative);
}

vec3 StaticRaindrops(vec2 UV, float Time, float UVScale) {
    vec2 TempUV = UV;
    TempUV *= UVScale;
    float ColumnID = floor(TempUV.x);
    float ColumnRandom = Random(vec2(ColumnID * 71.33, 17.91), RandomSeed);
    TempUV.y += Time * mix(0.06, 0.20, ColumnRandom);
    vec2 ID = floor(TempUV);
    vec3 RandomValue = RandomVec3Func(vec2(ID.x * 470.15, ID.y * 653.58), RandomSeed);
    TempUV = fract(TempUV) - 0.5;
    vec2 RandomPoint = (RandomValue.xy - 0.5) * 0.25;
    vec2 XY = RandomPoint - TempUV;
    float Distance = length(TempUV - RandomPoint);

    vec3 X = vec3(vec2(TempUV.x * 305.0 * 0.02, TempUV.y * 305.0 * 0.02), 1.8660254037844386);
    vec4 noiseResult = os2NoiseWithDerivatives_ImproveXY(X);
    float EdgeRandomCurveAdjust = noiseResult.w * mix(0.02, 0.175, fract(RandomValue.x));

    Distance = EdgeRandomCurveAdjust * 0.5 + Distance;
    float GradientFade = GradientWave(.0005, fract(Time * 0.02 + RandomValue.z));

    float DistanceMaxRange = 1.45 * GradientFade;
    vec2 Direction = (TempUV - RandomPoint);
    float Theta = 3.141592653 - acos(dot(normalize(Direction + 1e-6), vec2(0.0, 1.0)));
    Theta = Theta * RandomValue.z;
    float DistanceScale = 0.2 / (1.0 - 0.8 * cos(Theta - 3.141593 / 2.0 - 1.6));
    float YDistance = abs(TempUV.y - RandomPoint.y);

    float Scale = 1.65 * (0.2 + DistanceScale * 1.0) * DistanceMaxRange * mix(1.5, 0.5, RandomValue.x);
    vec2 TempXY = vec2(XY.x * 1.0, XY.y) * 4.0;
    float RandomScale = ProportionalMapToRange(0.85, 1.35, RandomValue.z);
    TempXY.x = RandomScale * mix(TempXY.x, TempXY.x / max(smoothstep(1.0, 0.4, YDistance * RandomValue.z), 0.001), smoothstep(1.0, 0.0, RandomValue.x));
    TempXY = TempXY + EdgeRandomCurveAdjust * 1.0;
    vec3 HeightAndNormal = RaindropSurface(TempXY, Scale, 1.0);
    HeightAndNormal.yz = -HeightAndNormal.yz;

    float RandomVisible = (fract(RandomValue.z * 10. * RandomSeed) < uStaticDrops ? 1.0 : 0.0);
    HeightAndNormal.yz = HeightAndNormal.yz * RandomVisible;
    HeightAndNormal.x = smoothstep(0.0, 1.0, HeightAndNormal.x) * RandomVisible;
    return HeightAndNormal;
}

vec4 RollingRaindrops(vec2 UV, float Time, float UVScale) {
    vec2 LocalUV = UV * UVScale;
    vec2 TempUV = LocalUV;

    vec2 ConstantA = vec2(6.0, 1.0);
    vec2 GridNum = ConstantA * 2.0;
    vec2 GridID = floor(LocalUV * GridNum);
    float RandomFloat = Random(vec2(GridID.x * 131.26, GridID.x * 101.81), RandomSeed);

    float TimeMovingY = Time * 0.85 * ProportionalMapToRange(0.1, 0.25, RandomFloat);
    LocalUV.y += TimeMovingY;
    float YShift = RandomFloat;
    LocalUV.y += YShift;

    vec2 ScaledUV = LocalUV * GridNum;
    GridID = floor(ScaledUV);
    vec3 RandomV = RandomVec3Func(vec2(GridID.x * 17.32, GridID.y * 2217.54), RandomSeed);
    vec2 GridUV = fract(ScaledUV) - vec2(0.5, 0.0);

    float SwingX = RandomV.x - 0.5;
    float SwingY = TempUV.y * 20.0;
    float SwingPosition = sin(SwingY + sin(GridID.y * RandomV.z + SwingY) + GridID.y * RandomV.z);
    SwingX += SwingPosition * (0.5 - abs(SwingX)) * (RandomV.z - 0.5);
    SwingX *= 0.65;
    float RandomNormalizedTime = fract(TimeMovingY + RandomV.z);
    SwingY = (GradientWave(0.87, RandomNormalizedTime) - 0.5) * 0.9 + 0.5;
    SwingY = clamp(SwingY, 0.15, 0.85);
    vec2 Position = vec2(SwingX, SwingY);

    vec2 XY = Position - GridUV;
    vec2 Direction = (GridUV - Position) * ConstantA.yx;
    float Distance = length(Direction);

    vec3 X = vec3(vec2(TempUV.x * 513.20 * 0.02, TempUV.y * 779.40 * 0.02), 2.1660251037743386);
    vec4 NoiseResult = os2NoiseWithDerivatives_ImproveXY(X);
    float EdgeRandomCurveAdjust = NoiseResult.w * mix(0.02, 0.175, fract(RandomV.y));

    Distance = EdgeRandomCurveAdjust + Distance;
    float DistanceMaxRange = 1.45;

    float Theta = 3.141592653 - acos(dot(normalize(Direction + 1e-6), vec2(0.0, 1.0)));
    Theta = Theta * RandomV.z;
    float DistanceScale = 0.2 / (1.0 - 0.8 * cos(Theta - 3.141593 / 2.0 - 1.6));
    float Scale = 1.65 * (0.2 + DistanceScale * 1.0) * DistanceMaxRange * mix(1.0, 0.25, RandomV.x * 1.0);
    vec2 TempXY = vec2(XY.x * 1.0, XY.y) * 4.0;
    TempXY *= vec2(1.0, 4.2);
    TempXY += EdgeRandomCurveAdjust * 0.85;
    vec3 HeightAndNormal = RaindropSurface(TempXY, Scale, 1.0);

    float TrailY = pow(smoothstep(1.0, SwingY, GridUV.y), 0.5);
    float TrailX = abs(GridUV.x - SwingX) * mix(0.8, 4.0, smoothstep(0.0, 1.0, RandomV.x));
    float Trail = smoothstep(0.25 * TrailY, 0.15 * TrailY * TrailY, TrailX);
    float TrailClamp = smoothstep(-0.02, 0.02, GridUV.y - SwingY);
    Trail *= TrailClamp * TrailY;

    float SignOfTrailX = sign(GridUV.x - SwingX);
    float TrailEdgeRandomCurveAdjust = NoiseResult.w * mix(0.002, 0.175, fract(RandomV.y));
    float TrailXDistance = MapToRange(0.0, 0.1, TrailEdgeRandomCurveAdjust * 0.5 + TrailX);
    vec2 TrailDirection = SignOfTrailX * vec2(1.0, 0.0) + vec2(0.0, 1.0) * smoothstep(1.0, 0.0, Trail) * 0.5;
    vec2 TrailXY = TrailDirection * TrailXDistance;

    vec3 TrailHeightAndNormal = RaindropSurface(TrailXY, 1.0, 1.0);
    TrailHeightAndNormal = TrailHeightAndNormal * pow(Trail * RandomV.y, 2.0);
    TrailHeightAndNormal.x = smoothstep(0.0, 1.0, TrailHeightAndNormal.x);

    SwingY = TempUV.y;
    float RemainTrail = smoothstep(0.2 * TrailY, 0.0, TrailX);
    float RemainDroplet = max(0.0, (sin(SwingY * (1.0 - SwingY) * 120.0) - GridUV.y)) * RemainTrail * TrailClamp * RandomV.z;
    SwingY = fract(SwingY * 10.0) + (GridUV.y - 0.5);
    vec2 RemainDropletXY = GridUV - vec2(SwingX, SwingY);
    RemainDropletXY = RemainDropletXY * vec2(1.2, 0.8);
    RemainDropletXY = RemainDropletXY + EdgeRandomCurveAdjust * 0.85;
    vec3 RemainDropletHeightAndNormal = RaindropSurface(RemainDropletXY, 2.0 * RemainDroplet, 1.0);
    RemainDropletHeightAndNormal.x = smoothstep(0.0, 1.0, RemainDropletHeightAndNormal.x);
    RemainDropletHeightAndNormal = TrailHeightAndNormal.x > 0.0 ? vec3(0.0) : RemainDropletHeightAndNormal;

    vec4 ReturnValue;
    ReturnValue.x = HeightAndNormal.x + TrailHeightAndNormal.x * TrailY * TrailClamp + RemainDropletHeightAndNormal.x * TrailY * TrailClamp;
    ReturnValue.yz = HeightAndNormal.yz + TrailHeightAndNormal.yz + RemainDropletHeightAndNormal.yz;
    ReturnValue.w = Trail;

    float RandomVisible = (fract(RandomV.z * 20. * RandomSeed) < uRollingDrops ? 1.0 : 0.0);
    ReturnValue = ReturnValue * RandomVisible;
    return ReturnValue;
}

vec4 Raindrops(vec2 UV, float Time, float UVScale00, float UVScale01, float UVScale02) {
    vec3 StaticRaindrop = StaticRaindrops(UV, Time, UVScale00);
    vec4 RollingRaindrop01 = RollingRaindrops(UV, Time, UVScale01);
    float Height = StaticRaindrop.x + RollingRaindrop01.x;
    vec2 Normal = StaticRaindrop.yz + RollingRaindrop01.yz;
    float Trail = RollingRaindrop01.w;
    return vec4(Height, Normal, Trail);
}

void main() {
    vec2 uv = vUv;
    vec2 aspect = vec2(uRes.x / uRes.y, 1.0);

    float dropsPerReferenceHeight = clamp(uResCss.y / ReferenceScreenHeight, 0.7, 1.8);
    vec2 rainUV = (uv - 0.5) * aspect * dropsPerReferenceHeight;

    float Time = uTime * uSpeed;
    float RaindropsAmount = sin(Time * 0.25) * 0.5 + 0.5;
    float MaxBlur = mix(uBlur, uBlur * 2.0, RaindropsAmount);
    float MinBlur = RaindropBlur;

    vec4 rd = Raindrops(rainUV, Time, StaticRaindropUVScale, RollingRaindropUVScaleLayer01, RollingRaindropUVScaleLayer02);
    float RaindropHeight = rd.x;
    float RaindropTrail = rd.w;
    vec2 RaindropNormal = -rd.yz;
    RaindropNormal = RaindropHeight > 0.0 ? RaindropNormal * 0.15 : vec2(0.0);

    vec2 refraction = RaindropNormal * 0.55 * uDistortion / aspect;
    float EdgeColorScale = smoothstep(0.2, 0.0, length(RaindropNormal));
    EdgeColorScale = RaindropHeight > 0.0 ? pow(EdgeColorScale, 0.5) * 0.2 + 0.8 : 1.0;

    float Blur = RaindropHeight > 0.0
        ? mix(MinBlur, MaxBlur, smoothstep(0.0, 1.6, length(RaindropNormal)))
        : MinBlur;
    Blur = ProportionalMapToRange(MinBlur, Blur, 1.0 - RaindropTrail);
    EdgeColorScale = pow(EdgeColorScale, 0.85);

    vec3 glass = blurScene(uv, refraction, Blur) * EdgeColorScale;

#ifndef LOW_QUALITY
    if (RaindropHeight > 0.0) {
        float ca = 0.0012 * smoothstep(0.0, 0.2, length(RaindropNormal)) / aspect.x;
        glass.r = blurScene(uv, refraction + vec2(ca, 0.0), Blur).r * EdgeColorScale;
        glass.b = blurScene(uv, refraction - vec2(ca, 0.0), Blur).b * EdgeColorScale;
        glass = mix(glass, glass * vec3(0.99, 1.0, 1.03), 0.10);
    }
#endif

    fragColor = vec4(glass * uDim, 1.0);
}
