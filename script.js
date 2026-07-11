const MESSAGES = [
    "Em ơiii",
    "Em có\nyêu anh không?",
    "Anh thích em\nmất rồi",
    "Làm người yêu\nanh nhé !!" // Chữ kết thúc, sau đó sẽ chuyển sang Trái Tim
];

const CHAR_SET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const matrixCanvas = document.getElementById("matrixCanvas");
const particleCanvas = document.getElementById("particleCanvas");
const matrixCtx = matrixCanvas.getContext("2d", { alpha: false });
const particleCtx = particleCanvas.getContext("2d", { alpha: true });

let width, height, isMobile;
let particles = [];
let messageIndex = 0;
let isHeartPhase = false;
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
    
    // Tự động chỉnh cỡ chữ to hơn cho Mobile, nhỏ lại một chút cho Desktop
    matrixFontSize = isMobile ? 24 : 18; 
    
    matrixCanvas.width = particleCanvas.width = width;
    matrixCanvas.height = particleCanvas.height = height;
    
    // Khởi tạo/Cập nhật lại các cột mưa ma trận khi resize
    const colCount = Math.floor(width / matrixFontSize) + 1;
    columns = Array(colCount).fill(0).map(() => ({
        y: Math.random() * (height / matrixFontSize),
        speed: Math.random() * 0.02 + 0.01,
        lastY: -1, 
        char: CHAR_SET[Math.floor(Math.random() * CHAR_SET.length)] 
    }));
}

// Hàm cốt lõi: Vẽ chữ/trái tim ra canvas ẩn và lấy tọa độ pixel
function getPoints() {
    const off = document.createElement("canvas");
    off.width = width;
    off.height = height;
    const ctx = off.getContext("2d");
    ctx.fillStyle = "white";

    if (isHeartPhase) {
        // Vẽ trái tim hoàn hảo bằng Bezier Curve
        const size = Math.min(width, height) * 0.2;
        const cx = width / 2;
        const cy = height / 2 - size * 0.2;
        ctx.translate(cx, cy);
        ctx.beginPath();
        ctx.moveTo(0, size * 0.3);
        ctx.bezierCurveTo(size * 0.5, -size * 0.3, size * 1.1, size * 0.1, 0, size);
        ctx.bezierCurveTo(-size * 1.1, size * 0.1, -size * 0.5, -size * 0.3, 0, size * 0.3);
        ctx.fill();
    } else {
        // Vẽ chữ hỗ trợ xuống dòng
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        let fSize = isMobile ? Math.min(width * 0.12, 40) : Math.min(width * 0.06, 80);
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
    const step = isMobile ? 4 : 5; // Khoảng cách giữa các hạt
    
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

    // 1. Quản lý thời gian đổi chữ
    phaseTimer += dt;
    if (phaseTimer > 4000) {
        phaseTimer = 0;
        if (!isHeartPhase) {
            if (messageIndex >= MESSAGES.length - 1) {
                isHeartPhase = true;
            } else {
                messageIndex++;
            }
        } else {
            isHeartPhase = false;
            messageIndex = 0;
        }
        nextPhase();
    }

    // 2. Vẽ Mưa Ma trận (Background)
    matrixCtx.fillStyle = "rgba(0, 0, 0, 0.05)";
    matrixCtx.fillRect(0, 0, width, height);
        
    matrixCtx.fillStyle = "rgba(245, 247, 248, 0.8)"; 
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
    
    const rectSize = isMobile ? 3 : 4;

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

            if (isHeartPhase && p.isActive) {
                particleCtx.fillStyle = "#e43e9c"; 
            } else {
                particleCtx.fillStyle = "#ffffff"; 
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