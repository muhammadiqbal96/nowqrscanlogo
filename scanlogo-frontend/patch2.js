const fs = require('fs');
const file = 'C:/NOWQR/nowqr-frontend/src/pages/dashboard/FlyerEditorPage.tsx';
let txt = fs.readFileSync(file, 'utf8');

const replacement = "    useEffect(() => {
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
            x: Math.round((el.x || 0) * scale + offsetX),
            y: Math.round((el.y || 0) * scale + offsetY),
            width: Math.round((el.width || 0) * scale),
            height: Math.round((el.height || 0) * scale),
            fontSize: el.fontSize ? Math.round(el.fontSize * scale) : el.fontSize,
        })))
        prevCanvasSizeRef.current = canvasSize
    }, [canvasSize])".slice(1, -1);

txt = txt.replace(/    useEffect\(\(\) => \{[\s\S]*?prevCanvasSizeRef\.current = canvasSize\r?\n    \}, \[canvasSize\]\)/, replacement);

fs.writeFileSync(file, txt);
console.log('patched');
