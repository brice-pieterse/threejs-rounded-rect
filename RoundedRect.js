// a function that takes in the material used on a THREE.PlaneGeometry
// rounds the corners of the rectangle using the specified radius of curvature


export const setThreeRoundedRect = (material, planeWidth, planeHeight, radius = 0.1) => {
     
    material.onBeforeCompile = (shader) => {

        //@Joey you can adjust the corner curvature by changing this radius (max should be 0.1 - based on uv coordinates)
        let RADIUS = radius
        let ASPECT = planeWidth/planeHeight
    
        shader.vertexShader = shader.vertexShader.replace('void main() {',
        'varying vec2 vUv; varying vec3 pos; uniform float vRadius; uniform float vAspect; uniform float vWidth; uniform float vHeight; \nvoid main() { vUv = uv; pos = position;');
    
        shader.fragmentShader = shader.fragmentShader.replace('void main() {',
        'varying vec2 vUv; varying vec3 pos; uniform float vRadius; uniform float vAspect; uniform float vHeight; uniform float vWidth; \n float f(float x) { return step(0.0, abs(x)); } \nvoid main() {');
    
        shader.fragmentShader = shader.fragmentShader.replace(
            `#include <dithering_fragment>`,
            `#include <dithering_fragment>
    
            vec2 aspectScalar = vec2(1.0, vHeight/vWidth);

            vec2 bottomLeftController = vec2( vRadius, vRadius * vAspect );
            vec2 bottomRightController = vec2( 1.0 - vRadius, vRadius * vAspect );
            vec2 topRightController = vec2( 1.0 - vRadius, 1.0 - vRadius * vAspect );
            vec2 topLeftController = vec2( vRadius, 1.0 - vRadius * vAspect );
    
            // vector facing our point from the corner circles
            vec2 tL = (vUv - topLeftController) * aspectScalar;
            vec2 tR = (vUv - topRightController) * aspectScalar;
            vec2 bL = (vUv - bottomLeftController) * aspectScalar;
            vec2 bR = (vUv - bottomRightController) * aspectScalar;

            // where that vector intersects the circles boundaries
            vec2 nTL = normalize(tL);
            vec2 nTR = normalize(tR);
            vec2 nBL = normalize(bL);
            vec2 nBR = normalize(bR);

            // the angle the vector makes on the circles
            float tLA = atan(nTL.y/nTL.x);
            float tRA = atan(nTR.y/nTR.x);
            float bRA = atan(nBR.y/nBR.x);
            float bLA = atan(nBL.y/nBL.x);
    
            // if a uv position is in corner, we can draw a line from the center of each circle to that uv position and the line will intersect the 4 circes in the same quadrant. 
            float quadrant1 = (floor(tLA / (0.5 * 3.14159265358979323846))) + 1.0;
            float quadrant2 = (floor(tRA / (0.5 * 3.14159265358979323846))) + 1.0;
            float quadrant3 = (floor(bRA / (0.5 * 3.14159265358979323846))) + 1.0;
            float quadrant4 = (floor(bLA / (0.5 * 3.14159265358979323846))) + 1.0;

            float minValue = min(min(quadrant1, quadrant2), min(quadrant3, quadrant4));
            float maxValue = max(max(quadrant1, quadrant2), max(quadrant3, quadrant4));
            
            // If the difference is zero, all quadrants are the same,
            float diff = abs(maxValue - minValue);

            // returns 0 if quadrantCheck is zero, else returns 1
            // if this is 0, we are in a corner
            float quadrantCheck = step(0.01, diff);
    
            // Then if one of these is negative, we're still in the bounds
            float lTL = length(tL) - vRadius;
            float lTR = length(tR) - vRadius;
            float lBL = length(bL) - vRadius;
            float lBR = length(bR) - vRadius;
    
            // meaning one of these must be 0 to be in bounds still
            float show = step(0.0, lTL) * step(0.0, lTR) * step(0.0, lBL) * step(0.0, lBR);
    
            // meaning this must be 1 to be in bounds, else 0
            show = 1.0 - show;
    
            // so finally this is 1 if we are in bounds, 0 if we are out
            float roundedCorner = min(quadrantCheck + show, 1.0);

            gl_FragColor = vec4(gl_FragColor.rgb, roundedCorner );    
            //pow(length(bL) * 10.0, 20.0)
            `,
        )
    
        shader.uniforms.vRadius = { value: RADIUS }
        shader.uniforms.vAspect = { value: ASPECT }
        shader.uniforms.vWidth = { value: planeWidth }
        shader.uniforms.vHeight = { value: planeHeight }
    }
}

