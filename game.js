class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer();
        this.speed = 0;
        this.maxSpeed = 200;
        this.acceleration = 0.5;
        this.deceleration = 0.3;
        this.time = 0;
        this.isGameRunning = false;

        this.scene.background = new THREE.Color(0x87CEEB); // 設置天空藍色背景

        this.init();
    }

    init() {
        // 設置渲染器
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        // 設置相機位置
        this.camera.position.set(0, 2, 5);
        this.camera.lookAt(0, 0, 0);

        // 建立賽道
        this.createTrack();

        // 建立環境裝飾
        this.createEnvironment();

        // 建立摩托車
        this.createMotorcycle();

        // 添加環境光源 - 調亮
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        // 添加平行光源 - 模擬太陽光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(-50, 100, 0);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // 事件監聽
        window.addEventListener('resize', () => this.onWindowResize());
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));

        // 開始按鈕事件
        document.getElementById('start-button').addEventListener('click', () => this.startGame());
    }

    createTrack() {
        // 建立簡單的賽道（地面）
        const trackGeometry = new THREE.PlaneGeometry(20, 1000);
        const trackMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x333333,
            side: THREE.DoubleSide 
        });
        this.track = new THREE.Mesh(trackGeometry, trackMaterial);
        this.track.rotation.x = -Math.PI / 2;
        this.scene.add(this.track);

        // 添加賽道邊界
        const borderGeometry = new THREE.BoxGeometry(0.5, 1, 1000);
        const borderMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        
        const leftBorder = new THREE.Mesh(borderGeometry, borderMaterial);
        leftBorder.position.x = -10;
        leftBorder.position.y = 0.5;
        this.scene.add(leftBorder);

        const rightBorder = new THREE.Mesh(borderGeometry, borderMaterial);
        rightBorder.position.x = 10;
        rightBorder.position.y = 0.5;
        this.scene.add(rightBorder);
    }

    createEnvironment() {
        // 創建樹木
        const createTree = (x, z) => {
            const treeGroup = new THREE.Group();

            // 樹幹
            const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
            const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.y = 1;
            treeGroup.add(trunk);

            // 樹冠
            const leavesGeometry = new THREE.ConeGeometry(1.5, 3, 8);
            const leavesMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });
            const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
            leaves.position.y = 3;
            treeGroup.add(leaves);

            treeGroup.position.set(x, 0, z);
            return treeGroup;
        };

        // 創建廣告牌
        const createBillboard = (x, z, rotation) => {
            const billboardGroup = new THREE.Group();

            // 廣告牌支柱
            const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 4, 8);
            const poleMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.y = 2;
            billboardGroup.add(pole);

            // 廣告牌面板
            const boardGeometry = new THREE.BoxGeometry(6, 3, 0.2);
            const boardMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
            const board = new THREE.Mesh(boardGeometry, boardMaterial);
            board.position.y = 4;
            billboardGroup.add(board);

            billboardGroup.position.set(x, 0, z);
            billboardGroup.rotation.y = rotation;
            return billboardGroup;
        };

        // 在賽道兩側添加樹木
        for(let z = 0; z > -900; z -= 30) {
            // 左側樹木
            this.scene.add(createTree(-13, z));
            // 右側樹木
            this.scene.add(createTree(13, z));

            // 每隔一段距離添加廣告牌
            if(z % 90 === 0) {
                this.scene.add(createBillboard(-16, z + 15, Math.PI / 4));
                this.scene.add(createBillboard(16, z + 15, -Math.PI / 4));
            }
        }
    }

    createMotorcycle() {
        // 建立簡單的摩托車模型
        const motorcycleGeometry = new THREE.Group();

        // 車身
        const bodyGeometry = new THREE.BoxGeometry(1, 1, 2);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x0000ff });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        motorcycleGeometry.add(body);

        // 輪子
        const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 32);
        const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        
        const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontWheel.rotation.z = Math.PI / 2;
        frontWheel.position.set(0, -0.5, -0.7);
        motorcycleGeometry.add(frontWheel);

        const backWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        backWheel.rotation.z = Math.PI / 2;
        backWheel.position.set(0, -0.5, 0.7);
        motorcycleGeometry.add(backWheel);

        this.motorcycle = motorcycleGeometry;
        this.motorcycle.position.y = 1;
        this.scene.add(this.motorcycle);
    }

    startGame() {
        this.isGameRunning = true;
        document.getElementById('menu').style.display = 'none';
        this.animate();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onKeyDown(event) {
        if (!this.isGameRunning) return;

        switch(event.key) {
            case 'ArrowUp':
                this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
                break;
            case 'ArrowDown':
                this.speed = Math.max(this.speed - this.deceleration, 0);
                break;
            case 'ArrowLeft':
                this.motorcycle.position.x = Math.max(this.motorcycle.position.x - 0.3, -9);
                break;
            case 'ArrowRight':
                this.motorcycle.position.x = Math.min(this.motorcycle.position.x + 0.3, 9);
                break;
        }
    }

    onKeyUp(event) {
        if (!this.isGameRunning) return;

        if (event.key === 'ArrowUp') {
            this.speed = Math.max(this.speed - this.deceleration, 0);
        }
    }

    updateUI() {
        document.getElementById('speed-value').textContent = Math.round(this.speed);
        document.getElementById('time-value').textContent = Math.round(this.time);
    }

    animate() {
        if (!this.isGameRunning) return;

        requestAnimationFrame(() => this.animate());
        
        // 更新遊戲時間
        this.time += 0.016; // 約等於每幀 16ms

        // 更新摩托車位置
        this.motorcycle.position.z -= this.speed * 0.01;
        
        // 更新相機位置
        this.camera.position.z = this.motorcycle.position.z + 5;
        this.camera.lookAt(this.motorcycle.position);

        // 更新 UI
        this.updateUI();

        // 渲染場景
        this.renderer.render(this.scene, this.camera);
    }
}

// 創建遊戲實例
const game = new Game();
