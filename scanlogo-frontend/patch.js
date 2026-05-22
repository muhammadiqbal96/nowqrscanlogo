const fs = require('fs');
const file = 'C:/NOWQR/nowqr-frontend/src/pages/dashboard/FlyerEditorPage.tsx';
let txt = fs.readFileSync(file, 'utf8');

const replacement =     useEffect(() => {
        const prev = prevCanvasSizeRef.current
        if (prev.w === canvasSize.w && prev.h === canvasSize.h) return
        
        // Use uniform scale to maintain the design aspect ratio
        const scaleX = canvasSize.w / prev.w
        const scaleY = canvasSize.h / prev.h
        const scale = Math.min(scaleX, scaleY)
        
        // Center the scaled elements within the new canvas dimensions
        const offsetX = (canvasSize.w - prev.w * scale) / 2
        const offsetY = (canvasSize.h - prev.h * scale) / 2

        setElements(els => els.map(el => ({
            ...el,
            x: Math.round(el.x * scale + offsetX),
            y: Math.round(el.y * scale + offsetY),
            width: Math.round(el.width * scale),
            height: Math.round(el.height * scale),
            fontSize: el.fontSize ? Math.round(el.fontSize * scale) : el.fontSize,
        })))
        prevCanvasSizeRef.current = canvasSize
    }, [canvasSize]);

// Use regex to match regardless of newline types
txt = txt.replace(/    useEffect\(\(\) => \{\n        const prev = prevCanvasSizeRef\.current[\s\S]*?prevCanvasSizeRef\.current = canvasSize\n    \}, \[canvasSize\]\)/, replacement);

fs.writeFileSync(file, txt);
console.log('Patched regex');
