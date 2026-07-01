// Hiệu ứng sao băng và bầu trời đêm Lung Linh
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.id = 'starCanvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '-1';
    document.body.appendChild(canvas);

    let width, height;
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // Arrays
    const stars = [];
    const shootingStars = [];
    const sparks = [];
    const dusts = [];

    const numStars = 300; // Tăng số lượng sao
    const numDusts = 60;  // Bụi ma thuật lơ lửng

    // Hàm tiện ích random
    const random = (min, max) => Math.random() * (max - min) + min;

    // --- LỚP SAO NỀN LẤP LÁNH ---
    class Star {
        constructor() {
            this.reset();
            this.phase = random(0, Math.PI * 2);
        }
        reset() {
            this.x = random(0, width);
            this.y = random(0, height);
            this.size = Math.random() > 0.95 ? random(1.5, 2.5) : random(0.5, 1.5);
            this.baseAlpha = random(0.1, 0.6);
            this.speed = random(0.01, 0.03);
            
            // Random màu sắc nhẹ (xanh dương đến tím nhạt)
            const hue = random(200, 280); 
            this.color = `hsl(${hue}, 80%, 80%)`;
        }
        update() {
            this.phase += this.speed;
            this.alpha = this.baseAlpha + Math.sin(this.phase) * 0.4;
        }
        draw() {
            if (this.alpha <= 0) return;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha));
            
            // Tạo glow nhẹ cho các sao to
            if (this.size > 1.5) {
                ctx.shadowBlur = 8;
                ctx.shadowColor = this.color;
            }
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        }
    }

    // --- LỚP BỤI MA THUẬT (Đom đóm / Particles lơ lửng) ---
    class Dust {
        constructor() {
            this.x = random(0, width);
            this.y = random(0, height);
            this.vx = random(-0.2, 0.2);
            this.vy = random(-0.6, -0.1); // Bay từ từ lên
            this.size = random(0.5, 2.5);
            this.life = random(0, 100);
            
            const colors = ['255,255,255', '255,220,255', '200,240,255'];
            this.color = colors[Math.floor(random(0, colors.length))];
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.life += 0.02;
            
            // Chuyển động lượn sóng
            this.x += Math.sin(this.life) * 0.5;

            // Reset khi bay ra khỏi khung hình
            if (this.y < -10 || this.x < -10 || this.x > width + 10) {
                this.y = height + 10;
                this.x = random(0, width);
            }
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            // Alpha dao động tạo độ nhấp nháy mờ ảo
            ctx.fillStyle = `rgba(${this.color}, ${Math.abs(Math.sin(this.life)) * 0.6})`;
            ctx.fill();
        }
    }

    // --- LỚP TIA LỬA (SPARKS) BẮN RA TỪ SAO BĂNG ---
    class Spark {
        constructor(x, y, colorPrefix) {
            this.x = x;
            this.y = y;
            // Bắn ra xung quanh hướng đi
            this.vx = random(-1.5, 1.5);
            this.vy = random(-1.5, 1.5);
            this.size = random(0.5, 2);
            this.life = 1;
            this.decay = random(0.015, 0.04);
            this.colorPrefix = colorPrefix;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.life -= this.decay;
        }
        draw() {
            if (this.life <= 0) return;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.colorPrefix + this.life + ')';
            ctx.fill();
        }
    }

    // --- LỚP SAO BĂNG ĐẸP MẮT ---
    class ShootingStar {
        constructor() {
            this.reset();
            this.waitTime = random(0, 500); // Giảm waitTime khởi tạo để nhanh xuất hiện hơn
            this.active = false;
        }
        reset() {
            // Cho phép bay sang trái hoặc sang phải (1 = phải, -1 = trái)
            this.dirX = Math.random() > 0.5 ? 1 : -1;
            
            // Góc rơi từ 20 độ đến 90 độ (thẳng đứng)
            this.angle = random(Math.PI / 9, Math.PI / 2);
            this.speed = random(15, 35); // Tốc độ đa dạng hơn
            this.len = random(80, 250);
            this.size = random(1.5, 3.5);
            
            this.vx = Math.cos(this.angle) * this.speed * this.dirX;
            this.vy = Math.sin(this.angle) * this.speed;

            // Xuất hiện ngẫu nhiên toàn màn hình (chủ yếu nửa trên)
            // Ngôi sao thực tế đột ngột cháy sáng giữa trời, nên xuất hiện giữa màn hình là tự nhiên
            this.x = random(0, width);
            this.y = random(-this.len, height * 0.7);
            
            // Palette màu rực rỡ, lung linh
            const colors = [
                'rgba(255, 255, 255, ', // Trắng tinh khôi
                'rgba(255, 200, 220, ', // Hồng pastel
                'rgba(180, 230, 255, ', // Xanh dương ngọc
                'rgba(255, 240, 180, ', // Vàng ánh kim
                'rgba(220, 180, 255, ', // Tím ma thuật
                'rgba(150, 255, 200, '  // Xanh lá neon nhẹ
            ];
            this.colorPrefix = colors[Math.floor(random(0, colors.length))];
            
            // Hiệu ứng fade in/out
            this.opacity = 0;
            this.fadeSpeed = random(0.05, 0.1);
            this.dying = false;

            this.active = true;
        }
        update() {
            if (!this.active) {
                this.waitTime--;
                if (this.waitTime <= 0) this.reset();
                return;
            }

            this.x += this.vx;
            this.y += this.vy;

            // Fade in mượt mà
            if (!this.dying && this.opacity < 1) {
                this.opacity += this.fadeSpeed;
            }

            // Rớt các tia lửa ma thuật ở phần đầu
            if (random(0, 1) > 0.3 && this.opacity > 0.5) {
                sparks.push(new Spark(this.x, this.y, this.colorPrefix));
                if (Math.random() > 0.5) sparks.push(new Spark(this.x, this.y, 'rgba(255,255,255,'));
            }

            // Bay ra khỏi màn hình hoặc xuống quá thấp thì fade out
            if (this.y > height + this.len || this.x < -this.len || this.x > width + this.len) {
                this.dying = true;
            }

            if (this.dying) {
                this.opacity -= this.fadeSpeed * 1.5;
                if (this.opacity <= 0) {
                    this.active = false;
                    this.waitTime = random(20, 150); // Mật độ dày đặc hơn (thời gian chờ ngắn lại)
                }
            }
        }
        draw() {
            if (!this.active || this.opacity <= 0) return;

            // Đuôi luôn hướng ngược lại chiều vx, vy
            const tailX = this.x - Math.cos(this.angle) * this.len * this.dirX;
            const tailY = this.y - Math.sin(this.angle) * this.len;
            
            // Vẽ đuôi sao băng Gradient fade-out
            const gradient = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
            gradient.addColorStop(0, this.colorPrefix + (1 * this.opacity) + ')');
            gradient.addColorStop(0.15, this.colorPrefix + (0.8 * this.opacity) + ')');
            gradient.addColorStop(1, this.colorPrefix + '0)');

            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(tailX, tailY);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = this.size;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Hiệu ứng Glow đầu sao băng rực rỡ
            ctx.shadowBlur = 25 * this.opacity;
            ctx.shadowColor = this.colorPrefix + (1 * this.opacity) + ')';
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 1.6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
            ctx.fill();
            
            // Vẽ "Cross Flare"
            const flareSize = this.size * 5 * this.opacity;
            ctx.beginPath();
            ctx.moveTo(this.x - flareSize, this.y);
            ctx.lineTo(this.x + flareSize, this.y);
            ctx.moveTo(this.x, this.y - flareSize);
            ctx.lineTo(this.x, this.y + flareSize);
            ctx.strokeStyle = this.colorPrefix + (0.9 * this.opacity) + ')';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Reset shadow
            ctx.shadowBlur = 0;
        }
    }

    // Khởi tạo các entity
    for (let i = 0; i < numStars; i++) stars.push(new Star());
    for (let i = 0; i < numDusts; i++) dusts.push(new Dust());
    // Tăng từ 7 lên 20 sao băng bay liên tục
    for (let i = 0; i < 20; i++) shootingStars.push(new ShootingStar()); 

    // Vòng lặp
    function animate() {
        // Clear frame
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, width, height);

        // Bật chế độ Blend Mode "lighter" giúp các ánh sáng trộn vào nhau rực rỡ hơn
        ctx.globalCompositeOperation = 'lighter';

        dusts.forEach(dust => {
            dust.update();
            dust.draw();
        });

        stars.forEach(star => {
            star.update();
            star.draw();
        });

        shootingStars.forEach(star => {
            star.update();
            star.draw();
        });

        // Loop array ngược để dễ xóa phần tử
        for (let i = sparks.length - 1; i >= 0; i--) {
            sparks[i].update();
            sparks[i].draw();
            if (sparks[i].life <= 0) {
                sparks.splice(i, 1);
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
});
