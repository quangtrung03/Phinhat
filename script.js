const MESSAGES = [
    "3",
    "2",
    "1",
    "Em ơiii",
    "Em có\nyêu anh không?",
    "Anh thích em\nmất rồi",
    "Làm người yêu\nanh nhé !!" 
];

const CHAR_SET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const matrixCanvas = document.getElementById("matrixCanvas");
const particleCanvas = document.getElementById("particleCanvas");
const matrixCtx = matrixCanvas.getContext("2d", { alpha: false });
const particleCtx = particleCanvas.getContext("2d", { alpha: true });

let width, height, isMobile, dpr;
let particles = [];
let messageIndex = 0;
let phaseIndex = 0;
let lastTime = 0;
let phaseTimer = 0;

// Cấu hình Background Ma trận
let matrixFontSize = 24; 
let columns = [];

function init() {
    resize();
    window.addEventListener("resize", resize);
    nextPhase();
    requestAnimationFrame(loop);
}

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    isMobile = width < 768;
    dpr = window.devicePixelRatio || 1;
    
    // Tăng mật độ ký tự trên mobile và giữ canvas sắc nét theo DPR
    matrixFontSize = isMobile ? 14 : 18; 
    
    matrixCanvas.width = particleCanvas.width = Math.round(width * dpr);
    matrixCanvas.height = particleCanvas.height = Math.round(height * dpr);
    matrixCanvas.style.width = particleCanvas.style.width = `${width}px`;
    matrixCanvas.style.height = particleCanvas.style.height = `${height}px`;
    matrixCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    particleCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    // Khởi tạo/Cập nhật lại các cột mưa ma trận khi resize
    const colCount = Math.floor(width / matrixFontSize) + 1;
    columns = Array(colCount).fill(0).map(() => ({
        y: Math.random() * (height / matrixFontSize),
        speed: Math.random() * 0.02 + 0.01,
        lastY: -1, 
        char: CHAR_SET[Math.floor(Math.random() * CHAR_SET.length)] 
    }));
}

function getPhaseType() {
    if (phaseIndex < MESSAGES.length) {
        return "text";
    }

    return "htmlHeart";
}

function drawHtmlHeart(ctx) {
    const scale = Math.min(width, height) * 0.0017;
    const centerX = width / 2;
    const centerY = height / 2 - Math.min(width, height) * 0.05;

    ctx.save();
    ctx.beginPath();

    for (let t = -Math.PI; t <= Math.PI; t += 0.01) {
        const x = 160 * Math.pow(Math.sin(t), 3);
        const y = 130 * Math.cos(t) - 50 * Math.cos(2 * t) - 20 * Math.cos(3 * t) - 10 * Math.cos(4 * t) + 25;
        const px = centerX + x * scale;
        const py = centerY - y * scale;

        if (t === -Math.PI) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }

    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

// Hàm cốt lõi: Vẽ chữ/trái tim ra canvas ẩn và lấy tọa độ pixel
function getPoints() {
    const off = document.createElement("canvas");
    off.width = width;
    off.height = height;
    const ctx = off.getContext("2d");
    const phaseType = getPhaseType();

    if (phaseType === "htmlHeart") {
        ctx.fillStyle = "#f50b02";
        drawHtmlHeart(ctx);
    } else {
        // Vẽ chữ hỗ trợ xuống dòng
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        let fSize = isMobile ? Math.min(width * 0.09, 30) : Math.min(width * 0.06, 80);
        ctx.font = `bold ${fSize}px "Segoe UI", Arial, sans-serif`;
        
        let text = MESSAGES[messageIndex];
        let lines = text.split('\n');
        let lh = fSize * 1.5;
        let startY = height / 2 - ((lines.length - 1) * lh) / 2;
        
        lines.forEach((line, i) => {
            ctx.fillText(line, width / 2, startY + i * lh);
        });
    }

    // Quét pixel để tạo danh sách điểm mục tiêu
    const data = ctx.getImageData(0, 0, width, height).data;
    const points = [];
    const step = isMobile ? 2 : 5; // Khoảng cách giữa các hạt
    
    for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
            if (data[(y * width + x) * 4 + 3] > 128) {
                points.push({ x, y });
            }
        }
    }
    return points;
}

// Chuyển cảnh
function nextPhase() {
    let points = getPoints();
    points.sort(() => Math.random() - 0.5); 

    while (particles.length < points.length) {
        particles.push({
            x: width / 2,
            y: height / 2,
            vx: 0,
            vy: 0,
            targetX: 0,
            targetY: 0,
            isActive: false,
            opacity: 0
        });
    }

    particles.forEach((p, i) => {
        if (i < points.length) {
            // SỬA Ở ĐÂY: Xóa bỏ + (Math.random() - 0.5) * 2 để các hạt bám chuẩn vào lưới tọa độ
            p.targetX = points[i].x; 
            p.targetY = points[i].y;
            p.isActive = true;
        } else {
            p.isActive = false; 
            p.targetX = Math.random() * width;
            p.targetY = Math.random() * height;
        }
    });
}

// Vòng lặp Animation
function loop(time) {
    const dt = time - lastTime;
    lastTime = time;

    // 1. Quản lý thời gian đổi cảnh
    phaseTimer += dt;
    if (phaseTimer > 4000) {
        phaseTimer = 0;
        phaseIndex = (phaseIndex + 1) % (MESSAGES.length + 1);

        if (phaseIndex < MESSAGES.length) {
            messageIndex = phaseIndex;
        } else if (phaseIndex === 0) {
            messageIndex = 0;
        }
        nextPhase();
    }

    const phaseType = getPhaseType();

    // 2. Vẽ Mưa Ma trận (Background)
    matrixCtx.fillStyle = "rgba(0, 0, 0, 0.05)";
    matrixCtx.fillRect(0, 0, width, height);
        
    matrixCtx.fillStyle = "rgba(177, 184, 185, 0.8)"; 
    matrixCtx.font = `${matrixFontSize}px monospace`;
    
    for (let i = 0; i < columns.length; i++) {
        const col = columns[i]; 
        const x = i * matrixFontSize;
        const currentY = Math.floor(col.y);
        
        if (currentY !== col.lastY) {
            col.char = CHAR_SET[Math.floor(Math.random() * CHAR_SET.length)];
            col.lastY = currentY;
        }
        
        const y = currentY * matrixFontSize; 
        
        matrixCtx.fillText(col.char, x, y);
        
        col.y += col.speed * dt; 
        
        if (y > height && Math.random() > 0.95) {
            col.y = 0;
            col.lastY = -1; 
            col.speed = Math.random() * 0.02 + 0.01; 
        }
    }

    // 3. Vẽ Foreground
    particleCtx.clearRect(0, 0, width, height);
    
    const rectSize = isMobile ? 2 : 4;

    particles.forEach(p => {
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        p.vx = p.vx * 0.8 + dx * 0.05;
        p.vy = p.vy * 0.8 + dy * 0.05;
        p.x += p.vx;
        p.y += p.vy;

        p.opacity += (p.isActive ? 1 - p.opacity : -p.opacity) * 0.05;

        if (p.opacity > 0.05) {
            particleCtx.globalAlpha = p.opacity;

            if (phaseType === "htmlHeart" && p.isActive) {
                particleCtx.fillStyle = "#c115c4";
            } else {
                particleCtx.fillStyle = "#1c46f1"; 
            }
            
            // SỬA Ở ĐÂY: Dùng Math.round để ép tọa độ về số nguyên. 
            // Giúp loại bỏ lỗi sub-pixel rendering khiến ô vuông bị mờ hoặc không đều.
            const drawX = Math.round(p.x - rectSize / 2);
            const drawY = Math.round(p.y - rectSize / 2);
            
            particleCtx.fillRect(drawX, drawY, rectSize, rectSize);
        }
    });

    requestAnimationFrame(loop);
}

// Chạy chương trình
init();