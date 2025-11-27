// ==================== UTILITY FUNCTIONS ====================
        function lerp(start, end, factor) {
            return start + (end - start) * factor;
        }

        function distance(x1, y1, x2, y2) {
            const dx = x2 - x1;
            const dy = y2 - y1;
            return Math.sqrt(dx * dx + dy * dy);
        }

        function clamp(value, min, max) {
            return Math.max(min, Math.min(max, value));
        }

        function formatNumber(num) {
            if (num < 1000) return num.toString();
            
            const suffixes = ['', 'k', 'm', 'b', 't'];
            const tier = Math.floor(Math.log10(Math.abs(num)) / 3);
            
            if (tier === 0) return num.toString();
            
            const suffix = suffixes[tier] || '';
            const scale = Math.pow(10, tier * 3);
            const scaled = num / scale;
            
            // Format to 1 decimal place if needed, otherwise show as integer
            if (scaled >= 100) {
                return Math.floor(scaled) + suffix;
            } else if (scaled >= 10) {
                return scaled.toFixed(1) + suffix;
            } else {
                return scaled.toFixed(1) + suffix;
            }
        }

        // ==================== CAMERA ====================
        class Camera {
            constructor() {
                this.x = 0;
                this.y = 0;
                this.targetX = 0;
                this.targetY = 0;
                this.lerpFactor = 0.12;
            }

            update(dt, targetX, targetY) {
                this.targetX = targetX;
                this.targetY = targetY;
                this.x = lerp(this.x, this.targetX, this.lerpFactor);
                this.y = lerp(this.y, this.targetY, this.lerpFactor);
            }

            worldToScreen(worldX, worldY, canvasWidth, canvasHeight) {
                const screenX = worldX - this.x + canvasWidth / 2;
                const screenY = worldY - this.y + canvasHeight / 2;
                return { x: screenX, y: screenY };
            }
        }

        // ==================== ATTACK EFFECT ====================
        class AttackEffect {
            constructor(x1, y1, x2, y2) {
                this.x1 = x1;
                this.y1 = y1;
                this.x2 = x2;
                this.y2 = y2;
                this.lifetime = 0;
                this.maxLifetime = 0.15; // Short flash effect
            }

            update(dt) {
                this.lifetime += dt;
            }

            render(ctx, camera, canvasWidth, canvasHeight) {
                if (this.lifetime >= this.maxLifetime) return;

                const screen1 = camera.worldToScreen(this.x1, this.y1, canvasWidth, canvasHeight);
                const screen2 = camera.worldToScreen(this.x2, this.y2, canvasWidth, canvasHeight);
                
                const alpha = 1 - (this.lifetime / this.maxLifetime);
                
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(screen1.x, screen1.y);
                ctx.lineTo(screen2.x, screen2.y);
                ctx.stroke();
                
                // Add a bright flash at the target
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.beginPath();
                ctx.arc(screen2.x, screen2.y, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            isDead() {
                return this.lifetime >= this.maxLifetime;
            }
        }

        // ==================== TRAIL EFFECT ====================
        class TrailEffect {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.lifetime = 0;
                this.maxLifetime = 0.3; // Trail fades over 0.3 seconds
            }

            update(dt) {
                this.lifetime += dt;
            }

            render(ctx, camera, canvasWidth, canvasHeight) {
                if (this.lifetime >= this.maxLifetime) return;

                const screen = camera.worldToScreen(this.x, this.y, canvasWidth, canvasHeight);
                const alpha = 1 - (this.lifetime / this.maxLifetime);
                
                ctx.save();
                ctx.globalAlpha = alpha * 0.5;
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(screen.x, screen.y, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            isDead() {
                return this.lifetime >= this.maxLifetime;
            }
        }

        // ==================== WHIRLWIND EFFECT ====================
        class WhirlwindEffect {
            constructor(x, y, radius) {
                this.x = x;
                this.y = y;
                this.radius = radius;
                this.maxRadius = radius;
                this.lifetime = 0;
                this.maxLifetime = 1.2; // Whirlwind lasts 1.2 seconds for better visibility
                this.rotation = 0;
                this.rotationSpeed = 6.0; // Radians per second (slower for longer duration)
            }

            update(dt) {
                this.lifetime += dt;
                this.rotation += this.rotationSpeed * dt;
                // Smooth continuous animation: expand to full size, then fade out
                const progress = this.lifetime / this.maxLifetime;
                
                if (progress < 0.2) {
                    // Smooth expansion phase (first 20%): grow from 0.7 to 1.0
                    const expandProgress = progress / 0.2;
                    this.radius = this.maxRadius * (0.7 + expandProgress * 0.3);
                } else if (progress < 0.8) {
                    // Hold at full size (20% to 80%): maintain 1.0 radius
                    this.radius = this.maxRadius;
                } else {
                    // Smooth fade-out phase (last 20%): contract from 1.0 to 0.6
                    const fadeProgress = (progress - 0.8) / 0.2;
                    this.radius = this.maxRadius * (1.0 - fadeProgress * 0.4);
                }
            }

            render(ctx, camera, canvasWidth, canvasHeight) {
                if (this.lifetime >= this.maxLifetime) return;

                const screen = camera.worldToScreen(this.x, this.y, canvasWidth, canvasHeight);
                const progress = this.lifetime / this.maxLifetime;
                const alpha = 1 - progress;
                
                ctx.save();
                ctx.translate(screen.x, screen.y);
                ctx.rotate(this.rotation);
                
                // Draw multiple spinning circles for visual clarity
                const numCircles = 3;
                for (let i = 0; i < numCircles; i++) {
                    const angle = (i / numCircles) * Math.PI * 2;
                    const offsetRadius = this.radius * 0.3;
                    const circleX = Math.cos(angle) * offsetRadius;
                    const circleY = Math.sin(angle) * offsetRadius;
                    
                    // Outer spinning circle (bright white)
                    ctx.globalAlpha = alpha * 0.9;
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(circleX, circleY, this.radius * 0.4, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // Inner spinning circle (bright white)
                    ctx.globalAlpha = alpha * 0.7;
                    ctx.beginPath();
                    ctx.arc(circleX, circleY, this.radius * 0.25, 0, Math.PI * 2);
                    ctx.stroke();
                }
                
                // Main outer circle (very visible, pulsing)
                ctx.globalAlpha = alpha * 0.8;
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.stroke();
                
                // Secondary outer circle for extra visibility
                ctx.globalAlpha = alpha * 0.4;
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * 0.9, 0, Math.PI * 2);
                ctx.stroke();
                
                // Inner circle (bright flash)
                ctx.globalAlpha = alpha * 1.0;
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * 0.2, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw spinning lines for extra visual clarity (more lines, thicker)
                ctx.globalAlpha = alpha * 0.7;
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 3;
                for (let i = 0; i < 12; i++) {
                    const angle = (i / 12) * Math.PI * 2 + this.rotation;
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(angle) * this.radius * 0.25, Math.sin(angle) * this.radius * 0.25);
                    ctx.lineTo(Math.cos(angle) * this.radius * 0.95, Math.sin(angle) * this.radius * 0.95);
                    ctx.stroke();
                }
                
                // Draw additional spinning particles for extra clarity
                ctx.globalAlpha = alpha * 0.9;
                ctx.fillStyle = '#FFFFFF';
                for (let i = 0; i < 16; i++) {
                    const angle = (i / 16) * Math.PI * 2 + this.rotation * 1.5;
                    const particleRadius = this.radius * 0.7;
                    const px = Math.cos(angle) * particleRadius;
                    const py = Math.sin(angle) * particleRadius;
                    ctx.beginPath();
                    ctx.arc(px, py, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                ctx.restore();
            }

            isDead() {
                return this.lifetime >= this.maxLifetime;
            }
        }

        // ==================== DAMAGE INDICATOR ====================
        class DamageIndicator {
            constructor(x, y, damage, isDamageDealt) {
                this.x = x;
                this.y = y;
                this.damage = Math.round(damage);
                this.isDamageDealt = isDamageDealt;
                this.lifetime = 0;
                this.maxLifetime = 1.0;
                this.velocityY = -50;
            }

            update(dt) {
                this.lifetime += dt;
                this.y += this.velocityY * dt;
                this.velocityY *= 0.95; // Slow down
            }

            render(ctx, camera, canvasWidth, canvasHeight) {
                if (this.lifetime >= this.maxLifetime) return;

                const screen = camera.worldToScreen(this.x, this.y, canvasWidth, canvasHeight);
                const alpha = 1 - (this.lifetime / this.maxLifetime);
                const fontSize = 24 + (this.lifetime * 8); // Bigger starting size

                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.font = `bold ${fontSize}px sans-serif`;
                // White color for damage dealt (hero attacks)
                ctx.fillStyle = this.isDamageDealt ? '#FFFFFF' : '#CCCCCC';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 3; // Thicker outline
                ctx.textAlign = 'center';
                ctx.strokeText(this.damage, screen.x, screen.y);
                ctx.fillText(this.damage, screen.x, screen.y);
                ctx.restore();
            }

            isDead() {
                return this.lifetime >= this.maxLifetime;
            }
        }

        // ==================== GOLD ORB ====================
        class GoldOrb {
            constructor(worldX, worldY, goldValue, targetScreenX, targetScreenY) {
                this.worldX = worldX;
                this.worldY = worldY;
                this.screenX = 0;
                this.screenY = 0;
                this.goldValue = goldValue;
                this.targetScreenX = targetScreenX;
                this.targetScreenY = targetScreenY;
                this.progress = 0;
                this.speed = 3.0; // Speed toward UI
                this.size = 4;
                this.collected = false;
                this.goldAdded = false;
                this.lingerTime = 0;
                this.lingerDuration = 0.4; // Linger for 0.4 seconds before moving
            }

            update(dt, camera, canvasWidth, canvasHeight) {
                if (this.collected) return;

                // Convert world position to screen
                const startScreen = camera.worldToScreen(this.worldX, this.worldY, canvasWidth, canvasHeight);
                
                // Linger at spawn location before moving
                if (this.lingerTime < this.lingerDuration) {
                    this.lingerTime += dt;
                    this.screenX = startScreen.x;
                    this.screenY = startScreen.y;
                    return;
                }
                
                // Move toward target after linger period
                this.progress += this.speed * dt;
                this.progress = Math.min(1, this.progress);
                
                // Lerp from start to target
                this.screenX = lerp(startScreen.x, this.targetScreenX, this.progress);
                this.screenY = lerp(startScreen.y, this.targetScreenY, this.progress);
                
                // Check if reached target
                const distToTarget = distance(this.screenX, this.screenY, this.targetScreenX, this.targetScreenY);
                if (distToTarget < 10 || this.progress >= 1) {
                    this.collected = true;
                }
            }

            render(ctx) {
                if (this.collected) return;

                ctx.save();
                ctx.globalAlpha = 0.9;
                ctx.fillStyle = '#FFFFFF';
                ctx.strokeStyle = '#CCCCCC';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(this.screenX, this.screenY, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }

            isDead() {
                return this.collected;
            }
        }

        // ==================== GEAR ====================
        class Gear {
            constructor(type, name) {
                this.type = type;
                this.name = name;
                this.level = 1;
                this.baseStats = this.getBaseStats();
            }

            getBaseStats() {
                switch (this.type) {
                    case 'weapon':
                        return { ad: 10, as: 0.5 };
                    case 'armor':
                        return { hp: 50, armor: 5 };
                    case 'boots':
                        return { ms: 50 };
                    default:
                        return {};
                }
            }

            getBonusStats() {
                const multiplier = this.level;
                const stats = {};
                for (const [key, value] of Object.entries(this.baseStats)) {
                    stats[key] = value * multiplier * 0.2; // 20% per level
                }
                return stats;
            }

            getTotalStats() {
                const base = { ...this.baseStats };
                const bonus = this.getBonusStats();
                const total = {};
                for (const key of Object.keys(base)) {
                    total[key] = base[key] + bonus[key];
                }
                return total;
            }

            getUpgradeCost() {
                return Math.floor(50 * Math.pow(1.5, this.level - 1));
            }
        }

        // ==================== HERO ====================
        class Hero {
            constructor() {
                this.x = 0;
                this.y = 0;
                this.angle = 0; // Start moving right
                this.baseSize = 20;
                this.size = this.baseSize;
                
                // Stats
                this.maxHp = 100;
                this.hp = this.maxHp;
                this.armor = 0;
                this.ad = 10;
                this.as = 1.0; // Attacks per second
                this.ms = 100; // Movement speed (pixels per second)
                
                // Combat
                this.attackCooldown = 0;
                this.meleeRange = 120; // 3x the original range (40 * 3)
                this.target = null;
                
                // Collision
                this.collisionRadius = this.size / 2; // Collision radius based on size
                
                // Progression
                this.level = 1;
                this.xp = 0;
                this.gold = 0;
                
                // Gear
                this.weapon = new Gear('weapon', 'Basic Sword');
                this.armorGear = new Gear('armor', 'Basic Armor');
                this.boots = new Gear('boots', 'Basic Boots');
                
                // Q Ability states
                this.chargeUpTime = 0;
                this.chargeUpDuration = 1.5; // 1.5 seconds charge-up
                this.chargeStacks = 0; // Stack counter for charge
                this.attackSpeedBoostTime = 0;
                this.attackSpeedBoostDuration = 3.0; // 3 seconds of attack speed boost
                this.baseMs = 100; // Store base movement speed
                this.baseAs = 1.0; // Store base attack speed
                this.lastTrailTime = 0;
                this.trailInterval = 0.05; // Create trail every 0.05 seconds
                
                // W Ability states (Enlarge & Hard Drift)
                this.enlargeTime = 0;
                this.enlargeDuration = 5.0; // 5 seconds of enlarged state
                this.enlargeStacks = 0; // Stack counter for enlarge
                this.baseTurnRate = 3.0; // Store base turn rate
                
                this.updateStats();
            }

            updateStats() {
                const weaponStats = this.weapon.getTotalStats();
                const armorStats = this.armorGear.getTotalStats();
                const bootsStats = this.boots.getTotalStats();
                
                this.maxHp = 100 + (armorStats.hp || 0);
                this.armor = (armorStats.armor || 0);
                this.ad = 10 + (weaponStats.ad || 0);
                
                // Update base stats
                this.baseAs = 1.0 + (weaponStats.as || 0);
                this.baseMs = 100 + (bootsStats.ms || 0);
                
                // Apply ability boosts if active
                this.applyAbilityBoosts();
                
                // Ensure HP doesn't exceed max
                if (this.hp > this.maxHp) {
                    this.hp = this.maxHp;
                }
            }

            applyAbilityBoosts() {
                // Start with base stats
                this.as = this.baseAs;
                this.ms = this.baseMs;
                
                // Apply movement speed boost during charge-up - stacks multiplicatively
                if (this.chargeStacks > 0) {
                    // Each stack doubles movement speed: 1 stack = 2x, 2 stacks = 4x, 3 stacks = 8x, etc.
                    this.ms = this.baseMs * Math.pow(2.0, this.chargeStacks);
                }
                
                // Apply attack speed boost after charge-up
                if (this.attackSpeedBoostTime > 0) {
                    this.as = this.baseAs * 3.0; // Triple attack speed
                }
            }

            update(dt, enemies, attackEffects, trailEffects) {
                // Update ability timers
                if (this.chargeUpTime > 0) {
                    this.chargeUpTime -= dt;
                    if (this.chargeUpTime <= 0) {
                        // Charge-up complete, activate attack speed boost
                        this.attackSpeedBoostTime = this.attackSpeedBoostDuration;
                        // Decrement charge stack when timer expires
                        if (this.chargeStacks > 0) {
                            this.chargeStacks--;
                            // If stacks remain, reset timer for next stack
                            if (this.chargeStacks > 0) {
                                this.chargeUpTime = this.chargeUpDuration;
                            }
                        }
                    }
                }
                
                if (this.attackSpeedBoostTime > 0) {
                    this.attackSpeedBoostTime -= dt;
                    if (this.attackSpeedBoostTime < 0) {
                        this.attackSpeedBoostTime = 0;
                    }
                }
                
                // Update W ability timer
                if (this.enlargeTime > 0) {
                    this.enlargeTime -= dt;
                    if (this.enlargeTime <= 0) {
                        // Decrement enlarge stack when timer expires
                        if (this.enlargeStacks > 0) {
                            this.enlargeStacks--;
                            // If stacks remain, reset timer for next stack
                            if (this.enlargeStacks > 0) {
                                this.enlargeTime = this.enlargeDuration;
                            } else {
                                this.enlargeTime = 0;
                            }
                        } else {
                            this.enlargeTime = 0;
                        }
                    }
                }
                
                // Apply W ability effects (size and turn rate) - stacks multiplicatively
                if (this.enlargeStacks > 0) {
                    // Each stack increases size by 50%: 1 stack = 1.5x, 2 stacks = 2.25x, 3 stacks = 3.375x, etc.
                    this.size = this.baseSize * Math.pow(1.5, this.enlargeStacks);
                } else {
                    this.size = this.baseSize;
                }
                // Update collision radius based on current size
                this.collisionRadius = this.size / 2;
                
                // Apply ability boosts
                this.applyAbilityBoosts();
                
                // Create trail effect during movement speed boost (throttled)
                if (this.chargeUpTime > 0 && trailEffects) {
                    this.lastTrailTime += dt;
                    if (this.lastTrailTime >= this.trailInterval) {
                        trailEffects.push(new TrailEffect(this.x, this.y));
                        this.lastTrailTime = 0;
                    }
                } else {
                    this.lastTrailTime = 0;
                }
                
                // Update attack cooldown
                if (this.attackCooldown > 0) {
                    this.attackCooldown -= dt;
                }
                
                // Find nearest enemy (any distance)
                const nearestEnemy = this.findNearestEnemy(enemies);
                
                if (nearestEnemy) {
                    // Calculate desired direction toward nearest enemy
                    const desiredAngle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
                    
                    // Obstacle avoidance: detect enemies ahead and calculate avoidance
                    const lookAheadDistance = this.ms * dt * 3; // Look ahead based on speed
                    const avoidanceRadius = this.collisionRadius + 30; // Avoidance radius (larger than collision)
                    
                    let avoidanceX = 0;
                    let avoidanceY = 0;
                    let avoidanceCount = 0;
                    
                    enemies.forEach(enemy => {
                        if (enemy.hp > 0) {
                            const dist = distance(this.x, this.y, enemy.x, enemy.y);
                            
                            // Check if enemy is in avoidance range
                            if (dist < avoidanceRadius * 2 && dist > 0) {
                                // Calculate vector from enemy to hero (repulsion)
                                const angleToEnemy = Math.atan2(enemy.y - this.y, enemy.x - this.x);
                                const angleFromEnemy = angleToEnemy + Math.PI; // Opposite direction
                                
                                // Strength of avoidance based on proximity (closer = stronger)
                                const avoidanceStrength = 1 - (dist / (avoidanceRadius * 2));
                                
                                avoidanceX += Math.cos(angleFromEnemy) * avoidanceStrength;
                                avoidanceY += Math.sin(angleFromEnemy) * avoidanceStrength;
                                avoidanceCount++;
                            }
                        }
                    });
                    
                    // Normalize avoidance vector
                    if (avoidanceCount > 0) {
                        const avoidanceLength = Math.sqrt(avoidanceX * avoidanceX + avoidanceY * avoidanceY);
                        if (avoidanceLength > 0) {
                            avoidanceX /= avoidanceLength;
                            avoidanceY /= avoidanceLength;
                        }
                    }
                    
                    // Blend desired direction with avoidance
                    // When close to enemies, prioritize avoidance; when far, prioritize target
                    const distToNearest = distance(this.x, this.y, nearestEnemy.x, nearestEnemy.y);
                    const avoidanceWeight = Math.max(0, 1 - (distToNearest / (avoidanceRadius * 2)));
                    const targetWeight = 1 - avoidanceWeight;
                    
                    // Calculate blended direction
                    const targetX = Math.cos(desiredAngle) * targetWeight;
                    const targetY = Math.sin(desiredAngle) * targetWeight;
                    const blendedX = targetX + avoidanceX * avoidanceWeight;
                    const blendedY = targetY + avoidanceY * avoidanceWeight;
                    
                    // Calculate target angle from blended direction
                    const blendedAngle = Math.atan2(blendedY, blendedX);
                    
                    // Smooth steering: gradually adjust angle toward blended target
                    const angleDiff = blendedAngle - this.angle;
                    // Normalize angle difference to [-PI, PI]
                    let normalizedDiff = angleDiff;
                    while (normalizedDiff > Math.PI) normalizedDiff -= 2 * Math.PI;
                    while (normalizedDiff < -Math.PI) normalizedDiff += 2 * Math.PI;
                    
                    // Steer with a turn rate (radians per second)
                    // W ability allows harder angles (stronger turning) - scales with stacks
                    const turnRate = this.enlargeStacks > 0 ? this.baseTurnRate * (2.5 * this.enlargeStacks) : this.baseTurnRate;
                    const maxTurn = turnRate * dt;
                    const turnAmount = Math.max(-maxTurn, Math.min(maxTurn, normalizedDiff));
                    this.angle += turnAmount;
                    
                    // Move forward in current direction
                    const moveDistance = this.ms * dt;
                    this.x += Math.cos(this.angle) * moveDistance;
                    this.y += Math.sin(this.angle) * moveDistance;
                    
                    // Find attack target (enemies in melee range)
                    this.target = this.findAttackTarget(enemies);
                    
                    // Auto-attack if target in melee range
                    if (this.target && this.attackCooldown <= 0) {
                        this.attack(this.target, attackEffects);
                        this.attackCooldown = 1 / this.as;
                    }
                } else {
                    // No enemies: stop and wait
                    this.target = null;
                }
            }

            findNearestEnemy(enemies) {
                const aliveEnemies = enemies.filter(e => e.hp > 0);
                if (aliveEnemies.length === 0) return null;
                
                // Find nearest enemy
                let nearest = null;
                let nearestDist = Infinity;
                
                aliveEnemies.forEach(enemy => {
                    const dist = distance(this.x, this.y, enemy.x, enemy.y);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearest = enemy;
                    }
                });
                
                return nearest;
            }

            findAttackTarget(enemies) {
                const inRange = enemies.filter(e => {
                    const dist = distance(this.x, this.y, e.x, e.y);
                    return dist <= this.meleeRange && e.hp > 0;
                });
                
                if (inRange.length === 0) return null;
                
                // Sort by priority: distance -> HP -> age
                inRange.sort((a, b) => {
                    const distA = distance(this.x, this.y, a.x, a.y);
                    const distB = distance(this.x, this.y, b.x, b.y);
                    if (Math.abs(distA - distB) > 0.1) {
                        return distA - distB;
                    }
                    if (Math.abs(a.hp - b.hp) > 0.1) {
                        return a.hp - b.hp;
                    }
                    return a.spawnTime - b.spawnTime;
                });
                
                return inRange[0];
            }

            attack(target, attackEffects) {
                const damage = Math.max(1, this.ad - (target.armor || 0));
                const actualDamage = target.takeDamage(damage, this.x, this.y);
                
                // Create attack effect (line from hero to target)
                if (attackEffects) {
                    attackEffects.push(new AttackEffect(this.x, this.y, target.x, target.y));
                }
                
                // Note: Damage indicator creation handled in Game.update()
                return actualDamage;
            }

            takeDamage(amount, sourceX, sourceY) {
                const actualDamage = Math.max(1, amount - this.armor);
                this.hp -= actualDamage;
                if (this.hp < 0) this.hp = 0;
                return actualDamage;
            }

            addXP(amount) {
                this.xp += amount;
                const xpNeeded = this.getXPNeeded();
                
                // Handle multiple level ups if XP exceeds multiple thresholds
                while (this.xp >= xpNeeded) {
                    this.levelUp();
                }
            }

            getXPNeeded() {
                // More intuitive scaling: base XP + linear growth per level
                // Level 1: 100, Level 2: 150, Level 3: 200, etc.
                return 100 + (this.level - 1) * 50;
            }

            levelUp() {
                // Calculate excess XP before leveling up
                const xpNeededForCurrentLevel = this.getXPNeeded();
                const excessXP = this.xp - xpNeededForCurrentLevel;
                
                this.level++;
                
                // Set XP to excess (if any), otherwise 0
                this.xp = excessXP > 0 ? excessXP : 0;
                
                // Scaling stat gains on level up (better rewards at higher levels)
                const hpGain = 10 + Math.floor(this.level / 5);
                const adGain = 2 + Math.floor(this.level / 10);
                
                this.maxHp += hpGain;
                this.hp = this.maxHp;
                this.ad += adGain;
            }

            render(ctx, camera, canvasWidth, canvasHeight) {
                const screen = camera.worldToScreen(this.x, this.y, canvasWidth, canvasHeight);
                
                // Draw glow effect when attack speed is boosted
                if (this.attackSpeedBoostTime > 0) {
                    const glowIntensity = Math.min(1, this.attackSpeedBoostTime / this.attackSpeedBoostDuration);
                    ctx.save();
                    ctx.globalAlpha = glowIntensity * 0.6;
                    ctx.fillStyle = '#FFFFFF';
                    ctx.beginPath();
                    ctx.arc(screen.x, screen.y, this.size + 8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
                
                // Draw hero (square)
                ctx.save();
                ctx.translate(screen.x, screen.y);
                ctx.rotate(this.angle);
                ctx.fillStyle = '#FFFFFF';
                ctx.strokeStyle = '#CCCCCC';
                ctx.lineWidth = 2;
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
                ctx.strokeRect(-this.size / 2, -this.size / 2, this.size, this.size);
                ctx.restore();
                
                // Draw health bar
                const barWidth = 40;
                const barHeight = 6;
                const barX = screen.x - barWidth / 2;
                const barY = screen.y - this.size / 2 - 15;
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(barX, barY, barWidth, barHeight);
                
                const hpPercent = this.hp / this.maxHp;
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
                
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 1;
                ctx.strokeRect(barX, barY, barWidth, barHeight);
            }
        }

        // ==================== ENEMY ====================
        class Enemy {
            constructor(x, y, type, stageLevel = 1) {
                this.x = x;
                this.y = y;
                this.type = type;
                this.stageLevel = stageLevel;
                this.spawnTime = Date.now();
                this.attackCooldown = 0;
                
                const config = this.getConfig();
                const stageMultiplier = this.getStageMultiplier(stageLevel);
                
                this.maxHp = config.hp * stageMultiplier.hp;
                this.hp = this.maxHp;
                this.armor = config.armor * stageMultiplier.armor;
                this.ad = config.ad * stageMultiplier.damage;
                this.as = config.as * stageMultiplier.attackSpeed;
                this.ms = config.ms * stageMultiplier.movementSpeed;
                this.size = config.size;
                this.color = config.color;
                this.meleeRange = config.meleeRange;
                this.isRanged = config.isRanged;
                this.projectileCooldown = 0;
                
                // Collision
                this.collisionRadius = this.size / 2; // Collision radius based on size
            }
            
            getStageMultiplier(stage) {
                // Exponential scaling: each stage increases stats by ~10%
                // Stage 1: 1.0x, Stage 10: ~2.6x, Stage 20: ~6.7x, Stage 50: ~117x
                const baseMultiplier = Math.pow(1.1, stage - 1);
                
                return {
                    hp: baseMultiplier * 1.2, // HP scales faster
                    damage: baseMultiplier,
                    armor: baseMultiplier * 0.8, // Armor scales slower
                    attackSpeed: 1.0, // Attack speed doesn't scale (or scales very slowly)
                    movementSpeed: 1.0 + (stage - 1) * 0.02 // Movement speed scales linearly, max +20% at stage 10
                };
            }

            getConfig() {
                switch (this.type) {
                    case 'weak':
                        return {
                            hp: 30,
                            armor: 0,
                            ad: 5,
                            as: 0.8,
                            ms: 60,
                            size: 15,
                            color: '#808080',
                            meleeRange: 25,
                            isRanged: false
                        };
                    case 'strong':
                        return {
                            hp: 100,
                            armor: 2,
                            ad: 15,
                            as: 0.6,
                            ms: 50,
                            size: 20,
                            color: '#808080',
                            meleeRange: 30,
                            isRanged: false
                        };
                    case 'ranged':
                        return {
                            hp: 50,
                            armor: 1,
                            ad: 10,
                            as: 0.5,
                            ms: 70,
                            size: 18,
                            color: '#808080',
                            meleeRange: 0,
                            isRanged: true,
                            attackRange: 150
                        };
                }
            }

            update(dt, hero, enemies) {
                if (this.hp <= 0) return;
                
                // Update cooldowns
                if (this.attackCooldown > 0) {
                    this.attackCooldown -= dt;
                }
                if (this.projectileCooldown > 0) {
                    this.projectileCooldown -= dt;
                }
                
                const distToHero = distance(this.x, this.y, hero.x, hero.y);
                let newX = this.x;
                let newY = this.y;
                
                if (this.isRanged) {
                    // Ranged enemy: maintain distance
                    if (distToHero > this.attackRange) {
                        // Move towards hero
                        const angle = Math.atan2(hero.y - this.y, hero.x - this.x);
                        newX = this.x + Math.cos(angle) * this.ms * dt;
                        newY = this.y + Math.sin(angle) * this.ms * dt;
                    } else if (distToHero < this.attackRange * 0.7) {
                        // Move away from hero
                        const angle = Math.atan2(hero.y - this.y, hero.x - this.x);
                        newX = this.x - Math.cos(angle) * this.ms * dt;
                        newY = this.y - Math.sin(angle) * this.ms * dt;
                    }
                    
                    // Attack if in range
                    if (distToHero <= this.attackRange && this.projectileCooldown <= 0) {
                        // Create projectile (simplified - just damage hero directly for MVP)
                        const damage = this.ad;
                        hero.takeDamage(damage, this.x, this.y);
                        this.projectileCooldown = 1 / this.as;
                    }
                } else {
                    // Melee enemy: chase hero
                    if (distToHero > this.meleeRange) {
                        const angle = Math.atan2(hero.y - this.y, hero.x - this.x);
                        newX = this.x + Math.cos(angle) * this.ms * dt;
                        newY = this.y + Math.sin(angle) * this.ms * dt;
                    }
                    
                    // Attack if in range
                    if (distToHero <= this.meleeRange && this.attackCooldown <= 0) {
                        const damage = this.ad;
                        hero.takeDamage(damage, this.x, this.y);
                        this.attackCooldown = 1 / this.as;
                    }
                }
                
                // Collision resolution with hero
                const distToHeroNew = distance(newX, newY, hero.x, hero.y);
                const minDistHero = this.collisionRadius + hero.collisionRadius;
                
                if (distToHeroNew < minDistHero && distToHeroNew > 0) {
                    const overlap = minDistHero - distToHeroNew;
                    const angle = Math.atan2(newY - hero.y, newX - hero.x);
                    newX += Math.cos(angle) * overlap * 0.5;
                    newY += Math.sin(angle) * overlap * 0.5;
                }
                
                // Collision resolution with other enemies
                enemies.forEach(otherEnemy => {
                    if (otherEnemy !== this && otherEnemy.hp > 0) {
                        const dist = distance(newX, newY, otherEnemy.x, otherEnemy.y);
                        const minDist = this.collisionRadius + otherEnemy.collisionRadius;
                        
                        if (dist < minDist && dist > 0) {
                            const overlap = minDist - dist;
                            const angle = Math.atan2(newY - otherEnemy.y, newX - otherEnemy.x);
                            newX += Math.cos(angle) * overlap * 0.5;
                            newY += Math.sin(angle) * overlap * 0.5;
                        }
                    }
                });
                
                this.x = newX;
                this.y = newY;
            }

            takeDamage(amount, sourceX, sourceY) {
                const actualDamage = Math.max(1, amount - this.armor);
                this.hp -= actualDamage;
                if (this.hp < 0) this.hp = 0;
                return actualDamage;
            }

            render(ctx, camera, canvasWidth, canvasHeight, hero) {
                if (this.hp <= 0) return;
                
                const screen = camera.worldToScreen(this.x, this.y, canvasWidth, canvasHeight);
                
                // Draw enemy (triangle) - point toward hero
                ctx.save();
                ctx.translate(screen.x, screen.y);
                const angleToHero = Math.atan2(hero.y - this.y, hero.x - this.x);
                ctx.rotate(angleToHero);
                
                ctx.fillStyle = this.color;
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1;
                
                ctx.beginPath();
                ctx.moveTo(this.size, 0);
                ctx.lineTo(-this.size / 2, -this.size / 2);
                ctx.lineTo(-this.size / 2, this.size / 2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
                
                // Draw health bar
                const barWidth = 30;
                const barHeight = 4;
                const barX = screen.x - barWidth / 2;
                const barY = screen.y - this.size / 2 - 10;
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(barX, barY, barWidth, barHeight);
                
                const hpPercent = this.hp / this.maxHp;
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
            }
        }

        // ==================== SPELL ====================
        class Spell {
            constructor(name, cooldown, effect) {
                this.name = name;
                this.cooldown = cooldown;
                this.maxCooldown = cooldown;
                this.effect = effect;
                this.maxCharges = 2;
                this.currentCharges = 2;
                this.chargeCooldown = 0; // Time until next charge regenerates
            }

            update(dt) {
                // Regenerate charges
                if (this.currentCharges < this.maxCharges) {
                    if (this.chargeCooldown <= 0) {
                        // Cooldown finished, regenerate charge immediately
                        this.currentCharges++;
                        this.chargeCooldown = 0;
                        // If still not at max charges, start next charge cooldown
                        if (this.currentCharges < this.maxCharges) {
                            this.chargeCooldown = this.maxCooldown;
                        }
                    } else {
                        this.chargeCooldown -= dt;
                        if (this.chargeCooldown <= 0) {
                            this.currentCharges++;
                            this.chargeCooldown = 0;
                            // If still not at max charges, start next charge cooldown
                            if (this.currentCharges < this.maxCharges) {
                                this.chargeCooldown = this.maxCooldown;
                            }
                        }
                    }
                }
                
                // Legacy cooldown tracking (for visual purposes)
                if (this.cooldown > 0) {
                    this.cooldown -= dt;
                    if (this.cooldown < 0) this.cooldown = 0;
                }
            }

            cast(hero, enemies) {
                // Check if we have charges available
                if (this.currentCharges <= 0) return false;
                
                // Use a charge
                this.currentCharges--;
                this.effect(hero, enemies);
                
                // Start charge regeneration if not at max
                if (this.currentCharges < this.maxCharges && this.chargeCooldown <= 0) {
                    this.chargeCooldown = this.maxCooldown;
                }
                
                // Legacy cooldown for visual
                this.cooldown = this.maxCooldown;
                return true;
            }

            getCooldownPercent() {
                // Return charge cooldown progress if regenerating, otherwise 0
                if (this.currentCharges < this.maxCharges && this.chargeCooldown > 0) {
                    return this.chargeCooldown / this.maxCooldown;
                }
                return 0;
            }
            
            getCharges() {
                return this.currentCharges;
            }
            
            getMaxCharges() {
                return this.maxCharges;
            }
        }

        // ==================== GAME ====================
        class Game {
            constructor() {
                this.canvas = document.getElementById('gameCanvas');
                this.ctx = this.canvas.getContext('2d');
                // Handle resize events
                this.resize();
                
                // Listen to window resize
                window.addEventListener('resize', () => this.resize());
                
                // Listen to visualViewport changes (better for mobile browser UI)
                if (window.visualViewport) {
                    window.visualViewport.addEventListener('resize', () => this.resize());
                    window.visualViewport.addEventListener('scroll', () => this.resize());
                }
                
                // Handle orientation changes
                window.addEventListener('orientationchange', () => {
                    // Delay resize to allow orientation change to complete
                    setTimeout(() => this.resize(), 200);
                });
                
                // Initial resize after a short delay to ensure DOM is ready
                setTimeout(() => this.resize(), 100);
                
                // Additional resize after a longer delay for mobile browser UI to settle
                setTimeout(() => this.resize(), 500);
                
                // Store game instance globally for level up feedback
                window.gameInstance = this;
                
                this.camera = new Camera();
                this.hero = new Hero();
                this.enemies = [];
                this.damageIndicators = [];
                this.attackEffects = [];
                this.trailEffects = [];
                this.whirlwindEffects = [];
                this.goldOrbs = [];
                this.lastSpawnTime = 0;
                this.spawnInterval = 2.0;
                
                // Stage/Level system
                this.stageLevel = 1;
                this.enemiesKilledThisStage = 0;
                this.enemiesRequiredPerStage = 10; // Number of enemies to kill before advancing stage
                
                // Spells
                const gameRef = this;
                this.spells = {
                    damage: new Spell('Charge', 8.0, (hero, enemies) => {
                        // Activate charge-up phase (movement speed boost) - stacks by incrementing stacks
                        hero.chargeStacks++;
                        // Start timer if not already running
                        if (hero.chargeUpTime <= 0) {
                            hero.chargeUpTime = hero.chargeUpDuration;
                        }
                    }),
                    heal: new Spell('Enlarge', 15.0, (hero, enemies) => {
                        // Activate enlarge ability (50% size increase + harder drift angles) - stacks by incrementing stacks
                        hero.enlargeStacks++;
                        // Start timer if not already running
                        if (hero.enlargeTime <= 0) {
                            hero.enlargeTime = hero.enlargeDuration;
                        }
                    }),
                    placeholder: new Spell('Whirlwind', 12.0, (hero, enemies) => {
                        // Create visual effect
                        const whirlwindRadius = 150; // AoE radius
                        gameRef.whirlwindEffects.push(new WhirlwindEffect(hero.x, hero.y, whirlwindRadius));
                        
                        // Damage all enemies in range
                        enemies.forEach(enemy => {
                            if (enemy.hp > 0) {
                                const dist = distance(hero.x, hero.y, enemy.x, enemy.y);
                                if (dist <= whirlwindRadius) {
                                    // Whirlwind deals 150% of hero's attack damage
                                    const prevHp = enemy.hp;
                                    const damage = Math.max(1, (hero.ad * 1.5) - (enemy.armor || 0));
                                    enemy.takeDamage(damage, hero.x, hero.y);
                                    
                                    // Create damage indicator
                                    const actualDamage = prevHp - enemy.hp;
                                    if (actualDamage > 0) {
                                        gameRef.damageIndicators.push(new DamageIndicator(enemy.x, enemy.y, actualDamage, true));
                                    }
                                }
                            }
                        });
                    })
                };
                
                // Game state
                this.state = 'playing'; // playing, paused, shop
                this.inspectingGear = null;
                
                // Input
                this.setupInput();
                this.setupUI();
                
                // Load save
                this.loadGame();
                
                // Start game loop
                this.lastTime = performance.now();
                this.gameLoop(this.lastTime);
            }

            resize() {
                // Get the viewport container size (mobile viewport or full screen)
                const viewport = document.getElementById('mobileViewport');
                
                // On mobile, use window.innerHeight/Width which accounts for browser UI
                // Use visualViewport API if available (better for mobile browser UI)
                let displayWidth, displayHeight;
                
                // Check if we're on mobile
                const isMobile = window.innerWidth <= 768;
                
                if (isMobile && window.visualViewport) {
                    // visualViewport gives us the actual visible area (accounts for browser UI)
                    displayWidth = window.visualViewport.width;
                    displayHeight = window.visualViewport.height;
                    
                    // Update viewport container size dynamically to match visual viewport
                    if (viewport) {
                        viewport.style.width = displayWidth + 'px';
                        viewport.style.height = displayHeight + 'px';
                    }
                } else if (isMobile) {
                    // Fallback: use window.innerHeight which accounts for browser UI
                    displayWidth = window.innerWidth;
                    displayHeight = window.innerHeight;
                    
                    // Update viewport container size dynamically
                    if (viewport) {
                        viewport.style.width = displayWidth + 'px';
                        viewport.style.height = displayHeight + 'px';
                    }
                } else {
                    // Desktop: use container's actual size
                    if (viewport) {
                        displayWidth = viewport.clientWidth;
                        displayHeight = viewport.clientHeight;
                    } else {
                        displayWidth = window.innerWidth;
                        displayHeight = window.innerHeight;
                    }
                }
                
                // Store CSS dimensions for use in rendering
                this.cssWidth = displayWidth;
                this.cssHeight = displayHeight;
                
                // Update viewport info display
                const viewportInfo = document.getElementById('viewportInfo');
                if (viewportInfo) {
                    viewportInfo.textContent = `${Math.round(displayWidth)} × ${Math.round(displayHeight)}`;
                }
                
                // Get device pixel ratio for crisp rendering on high-DPI displays
                const dpr = window.devicePixelRatio || 1;
                
                // Set CSS size to match viewport size
                this.canvas.style.width = displayWidth + 'px';
                this.canvas.style.height = displayHeight + 'px';
                
                // Set canvas internal resolution scaled by device pixel ratio
                // This ensures crisp rendering on high-DPI displays
                this.canvas.width = displayWidth * dpr;
                this.canvas.height = displayHeight * dpr;
                
                // Reset transform and scale context
                this.ctx.setTransform(1, 0, 0, 1, 0, 0);
                this.ctx.scale(dpr, dpr);
                
                // Set image rendering for crisp pixels
                this.ctx.imageSmoothingEnabled = false;
            }

            setupInput() {
                document.addEventListener('keydown', (e) => {
                    if (this.state !== 'playing') return;
                    
                    if (e.key === 'q' || e.key === 'Q') {
                        this.handleSpellClick('spellDamage', this.spells.damage);
                    }
                    if (e.key === 'w' || e.key === 'W') {
                        this.handleSpellClick('spellHeal', this.spells.heal);
                    }
                    if (e.key === 'e' || e.key === 'E') {
                        this.handleSpellClick('spellPlaceholder', this.spells.placeholder);
                    }
                    if (e.key === 's' || e.key === 'S') {
                        this.openShop();
                    }
                    if (e.key === 'i' || e.key === 'I') {
                        this.openInventory();
                    }
                    if (e.key === 'Escape') {
                        this.closeMenus();
                    }
                });
            }

            setupUI() {
                document.getElementById('closeShop').addEventListener('click', () => this.closeMenus());
                document.getElementById('closeInventory').addEventListener('click', () => this.closeMenus());
                
                document.getElementById('spellDamage').addEventListener('click', () => {
                    if (this.state === 'playing') {
                        this.handleSpellClick('spellDamage', this.spells.damage);
                    }
                });
                
                document.getElementById('spellHeal').addEventListener('click', () => {
                    if (this.state === 'playing') {
                        this.handleSpellClick('spellHeal', this.spells.heal);
                    }
                });
                
                document.getElementById('spellPlaceholder').addEventListener('click', () => {
                    if (this.state === 'playing') {
                        this.handleSpellClick('spellPlaceholder', this.spells.placeholder);
                    }
                });
                
                document.getElementById('shopButtonBottom').addEventListener('click', () => {
                    this.openShop();
                });
                
                document.getElementById('inspectUpgrade').addEventListener('click', () => {
                    if (this.inspectingGear) {
                        this.upgradeGear(this.inspectingGear);
                    }
                });
                
                document.getElementById('resetGameButton').addEventListener('click', () => {
                    if (confirm('Are you sure you want to reset the game? This will reset all gear upgrades, hero level, gold, and stage progress.')) {
                        this.resetGame();
                    }
                });
                
                document.getElementById('addGoldButton').addEventListener('click', () => {
                    const amount = prompt('Enter amount of gold to add:');
                    if (amount !== null) {
                        const goldAmount = parseInt(amount);
                        if (!isNaN(goldAmount) && goldAmount > 0) {
                            this.hero.gold += goldAmount;
                            this.saveGame();
                        } else {
                            alert('Please enter a valid positive number.');
                        }
                    }
                });
                
                document.getElementById('addLevelsButton').addEventListener('click', () => {
                    const amount = prompt('Enter number of levels to add:');
                    if (amount !== null) {
                        const levelAmount = parseInt(amount);
                        if (!isNaN(levelAmount) && levelAmount > 0) {
                            for (let i = 0; i < levelAmount; i++) {
                                this.hero.levelUp();
                            }
                            this.saveGame();
                        } else {
                            alert('Please enter a valid positive number.');
                        }
                    }
                });
                
                document.getElementById('setStageButton').addEventListener('click', () => {
                    const stage = prompt('Enter stage number to go to:');
                    if (stage !== null) {
                        const stageNum = parseInt(stage);
                        if (!isNaN(stageNum) && stageNum >= 1) {
                            this.stageLevel = stageNum;
                            this.enemiesKilledThisStage = 0;
                            this.enemiesRequiredPerStage = 10 + Math.floor((this.stageLevel - 1) / 10) * 2;
                            this.enemies = [];
                            this.spawnEnemy();
                            this.saveGame();
                        } else {
                            alert('Please enter a valid stage number (1 or higher).');
                        }
                    }
                });
            }

            handleSpellClick(buttonId, spell) {
                // Try to cast normally first
                const castSuccess = spell.cast(this.hero, this.enemies);
                
                // If no charges available, reduce charge cooldown by 1 second
                if (!castSuccess && spell.currentCharges <= 0 && spell.chargeCooldown > 0) {
                    spell.chargeCooldown = Math.max(0, spell.chargeCooldown - 1.0);
                    
                    // If cooldown reached 0, immediately regenerate charge
                    if (spell.chargeCooldown <= 0 && spell.currentCharges < spell.maxCharges) {
                        spell.currentCharges++;
                        spell.chargeCooldown = 0;
                        // If still not at max charges, start next charge cooldown
                        if (spell.currentCharges < spell.maxCharges) {
                            spell.chargeCooldown = spell.maxCooldown;
                        }
                    }
                }
            }

            openShop() {
                this.state = 'shop';
                document.getElementById('shopPanel').classList.add('open');
                this.updateShopUI();
            }

            openInventory() {
                this.state = 'shop';
                document.getElementById('inventoryPanel').classList.add('open');
                this.updateInventoryUI();
            }

            closeMenus() {
                this.state = 'playing';
                document.getElementById('shopPanel').classList.remove('open');
                document.getElementById('inventoryPanel').classList.remove('open');
                document.getElementById('gearInspect').classList.remove('show');
                this.inspectingGear = null;
            }

            updateShopUI() {
                const container = document.getElementById('gearUpgrades');
                container.innerHTML = '';
                
                const gears = [
                    { gear: this.hero.weapon, slot: 'weapon', slotName: 'Weapon' },
                    { gear: this.hero.armorGear, slot: 'armor', slotName: 'Armor' },
                    { gear: this.hero.boots, slot: 'boots', slotName: 'Boots' }
                ];
                
                gears.forEach(({ gear, slot, slotName }) => {
                    const totalStats = gear.getTotalStats();
                    const cost = gear.getUpgradeCost();
                    
                    const item = document.createElement('div');
                    item.className = 'upgrade-item';
                    
                    // Build stats display
                    let statsText = '';
                    Object.keys(totalStats).forEach(key => {
                        const statName = key.toUpperCase();
                        statsText += `${statName}: ${totalStats[key].toFixed(1)} `;
                    });
                    
                    item.innerHTML = `
                        <div class="upgrade-info">
                            <div class="upgrade-name">${gear.name} (Lv. ${gear.level})</div>
                            <div class="upgrade-stats">${statsText || 'No stats'}</div>
                        </div>
                        <button class="upgrade-button" data-slot="${slot}">
                            ${formatNumber(cost)} Gold
                        </button>
                    `;
                    
                    const button = item.querySelector('button');
                    button.disabled = this.hero.gold < cost;
                    button.addEventListener('click', () => {
                        this.upgradeGear(gear);
                    });
                    
                    container.appendChild(item);
                });
            }

            updateInventoryUI() {
                const grid = document.getElementById('inventoryGrid');
                grid.innerHTML = '';
                
                const gears = [
                    { gear: this.hero.weapon, slot: 'weapon' },
                    { gear: this.hero.armorGear, slot: 'armor' },
                    { gear: this.hero.boots, slot: 'boots' }
                ];
                
                gears.forEach(({ gear, slot }) => {
                    const slotEl = document.createElement('div');
                    slotEl.className = 'gear-slot';
                    slotEl.innerHTML = `
                        <div class="gear-name">${gear.name}</div>
                        <div class="gear-level">Lv. ${gear.level}</div>
                    `;
                    slotEl.addEventListener('click', () => {
                        this.inspectGear(gear);
                    });
                    grid.appendChild(slotEl);
                });
            }

            inspectGear(gear) {
                this.inspectingGear = gear;
                document.getElementById('inspectName').textContent = `${gear.name} (Level ${gear.level})`;
                
                const statsContainer = document.getElementById('inspectStats');
                statsContainer.innerHTML = '';
                
                const baseStats = gear.getBaseStats();
                const bonusStats = gear.getBonusStats();
                const totalStats = gear.getTotalStats();
                const cost = gear.getUpgradeCost();
                
                Object.keys(totalStats).forEach(key => {
                    const row = document.createElement('div');
                    row.className = 'gear-stat-row';
                    const statName = key.toUpperCase();
                    row.innerHTML = `
                        <span>${statName}:</span>
                        <span>${totalStats[key].toFixed(1)} (+${bonusStats[key].toFixed(1)})</span>
                    `;
                    statsContainer.appendChild(row);
                });
                
                const costRow = document.createElement('div');
                costRow.className = 'gear-stat-row';
                costRow.style.marginTop = '10px';
                costRow.innerHTML = `
                    <span>Upgrade Cost:</span>
                    <span>${formatNumber(cost)} Gold</span>
                `;
                statsContainer.appendChild(costRow);
                
                const upgradeButton = document.getElementById('inspectUpgrade');
                upgradeButton.disabled = this.hero.gold < cost;
                upgradeButton.textContent = `Upgrade (${formatNumber(cost)} Gold)`;
                
                document.getElementById('gearInspect').classList.add('show');
            }

            upgradeGear(gear) {
                const cost = gear.getUpgradeCost();
                if (this.hero.gold < cost) return;
                
                this.hero.gold -= cost;
                gear.level++;
                this.hero.updateStats();
                
                // Update shop UI if shop is open
                if (document.getElementById('shopPanel').classList.contains('open')) {
                    this.updateShopUI();
                }
                
                // Update inventory UI if inventory is open
                if (document.getElementById('inventoryPanel').classList.contains('open')) {
                    this.updateInventoryUI();
                }
                
                // Update gear inspect if it's showing
                if (this.inspectingGear === gear) {
                    this.inspectGear(gear);
                }
                
                this.saveGame();
            }
            
            advanceStage() {
                // Advance to next stage
                this.stageLevel++;
                this.enemiesKilledThisStage = 0;
                
                // Scale enemies required per stage (slightly increase)
                // Stage 1-10: 10 enemies, Stage 11-20: 12 enemies, etc.
                this.enemiesRequiredPerStage = 10 + Math.floor((this.stageLevel - 1) / 10) * 2;
                
                // Clear all existing enemies (fresh start for new stage)
                this.enemies = [];
                
                // Immediately spawn first enemy of new stage
                this.spawnEnemy();
                
                // Adjust spawn interval based on stage (faster spawning at higher stages)
                this.spawnInterval = Math.max(0.3, 2.0 - (this.stageLevel - 1) * 0.05);
                
                // Save game on stage advancement
                this.saveGame();
            }

            spawnEnemy() {
                const angle = Math.random() * Math.PI * 2;
                const distance = 300 + Math.random() * 200;
                const x = this.hero.x + Math.cos(angle) * distance;
                const y = this.hero.y + Math.sin(angle) * distance;
                
                // Get enemy type weights based on stage (tutorial stages introduce enemies gradually)
                const { types, weights } = this.getEnemyTypeWeights(this.stageLevel);
                
                let rand = Math.random();
                let type = types[0];
                let cumulativeWeight = 0;
                for (let i = 0; i < weights.length; i++) {
                    cumulativeWeight += weights[i];
                    if (rand < cumulativeWeight) {
                        type = types[i];
                        break;
                    }
                }
                
                this.enemies.push(new Enemy(x, y, type, this.stageLevel));
            }
            
            getEnemyTypeWeights(stage) {
                // Tutorial stages (1-10): Gradually introduce enemy types
                if (stage <= 3) {
                    // Stages 1-3: Only weak enemies
                    return { types: ['weak'], weights: [1.0] };
                } else if (stage <= 5) {
                    // Stages 4-5: Weak + Strong
                    return { types: ['weak', 'strong'], weights: [0.7, 0.3] };
                } else if (stage <= 7) {
                    // Stages 6-7: All types, weighted toward weak
                    return { types: ['weak', 'strong', 'ranged'], weights: [0.5, 0.3, 0.2] };
                } else {
                    // Stage 8+: Normal distribution, more strong/ranged as stage increases
                    const strongWeight = Math.min(0.4, 0.2 + (stage - 8) * 0.02);
                    const rangedWeight = Math.min(0.3, 0.15 + (stage - 8) * 0.015);
                    const weakWeight = 1.0 - strongWeight - rangedWeight;
                    return { types: ['weak', 'strong', 'ranged'], weights: [weakWeight, strongWeight, rangedWeight] };
                }
            }

            spawnGoldOrbs(worldX, worldY, totalGold) {
                // Get UI gold position (top right)
                const goldDisplay = document.querySelector('.gold-display');
                if (!goldDisplay) return;
                
                const goldRect = goldDisplay.getBoundingClientRect();
                const canvasRect = this.canvas.getBoundingClientRect();
                
                // Calculate target position relative to canvas (in CSS pixels, context is already scaled)
                const targetScreenX = goldRect.left + goldRect.width / 2 - canvasRect.left;
                const targetScreenY = goldRect.top + goldRect.height / 2 - canvasRect.top;
                
                // Spawn 3-4 orbs, split gold value
                const orbCount = Math.min(4, Math.max(1, Math.floor(totalGold / 2) + 1));
                const goldPerOrb = Math.floor(totalGold / orbCount);
                const remainder = totalGold % orbCount;
                
                for (let i = 0; i < orbCount; i++) {
                    const goldValue = i === 0 ? goldPerOrb + remainder : goldPerOrb;
                    // Small random offset for visual spread
                    const offsetX = (Math.random() - 0.5) * 20;
                    const offsetY = (Math.random() - 0.5) * 20;
                    this.goldOrbs.push(new GoldOrb(
                        worldX + offsetX,
                        worldY + offsetY,
                        goldValue,
                        targetScreenX,
                        targetScreenY
                    ));
                }
            }

            update(dt) {
                // Game continues playing even when shop is open
                // Only pause if explicitly paused (not implemented yet)
                // if (this.state !== 'playing') return;
                
                // Track previous HP BEFORE any updates
                const heroPrevHp = this.hero.hp;
                const enemyPrevHps = new Map();
                this.enemies.forEach(enemy => {
                    enemyPrevHps.set(enemy, enemy.hp);
                });
                
                // Update hero (pass attackEffects and trailEffects so attacks can create visual effects)
                // Hero attacks happen here, which modify enemy HP
                this.hero.update(dt, this.enemies, this.attackEffects, this.trailEffects);
                
                // Check if hero took damage
                if (this.hero.hp < heroPrevHp) {
                    const damageTaken = heroPrevHp - this.hero.hp;
                    this.damageIndicators.push(new DamageIndicator(this.hero.x, this.hero.y, damageTaken, false));
                }
                
                // Create damage indicators for enemies that took damage from hero
                this.enemies.forEach(enemy => {
                    const prevHp = enemyPrevHps.get(enemy);
                    if (prevHp !== undefined && enemy.hp < prevHp) {
                        const damageDealt = prevHp - enemy.hp;
                        this.damageIndicators.push(new DamageIndicator(enemy.x, enemy.y, damageDealt, true));
                    }
                });
                
                // Update camera
                this.camera.update(dt, this.hero.x, this.hero.y);
                
                // Update enemies (they may take more damage or move)
                this.enemies.forEach(enemy => {
                    enemy.update(dt, this.hero, this.enemies);
                });
                
                // Update spells
                Object.values(this.spells).forEach(spell => spell.update(dt));
                
                // Update attack effects
                this.attackEffects.forEach(effect => effect.update(dt));
                this.attackEffects = this.attackEffects.filter(effect => !effect.isDead());
                
                // Update trail effects
                this.trailEffects.forEach(effect => effect.update(dt));
                this.trailEffects = this.trailEffects.filter(effect => !effect.isDead());
                
                // Update whirlwind effects
                this.whirlwindEffects.forEach(effect => effect.update(dt));
                this.whirlwindEffects = this.whirlwindEffects.filter(effect => !effect.isDead());
                
                // Update damage indicators
                this.damageIndicators.forEach(indicator => indicator.update(dt));
                this.damageIndicators = this.damageIndicators.filter(ind => !ind.isDead());
                
                // Update gold orbs and collect gold
                let goldCollected = 0;
                const dpr = window.devicePixelRatio || 1;
                const cssWidth = this.canvas.width / dpr;
                const cssHeight = this.canvas.height / dpr;
                this.goldOrbs.forEach(orb => {
                    orb.update(dt, this.camera, cssWidth, cssHeight);
                    if (orb.collected && !orb.goldAdded) {
                        goldCollected += orb.goldValue;
                        orb.goldAdded = true;
                    }
                });
                if (goldCollected > 0) {
                    this.hero.gold += goldCollected;
                }
                this.goldOrbs = this.goldOrbs.filter(orb => !orb.isDead());
                
                // Spawn enemies
                this.lastSpawnTime += dt;
                if (this.lastSpawnTime >= this.spawnInterval) {
                    this.spawnEnemy();
                    this.lastSpawnTime = 0;
                    // Spawn interval scales with both hero level and stage
                    // Higher stages spawn faster, but hero level also affects it
                    const baseInterval = 2.0;
                    const levelReduction = this.hero.level * 0.1;
                    const stageReduction = (this.stageLevel - 1) * 0.05;
                    this.spawnInterval = Math.max(0.3, baseInterval - levelReduction - stageReduction);
                }
                
                // Check enemy deaths and drop loot
                this.enemies.forEach((enemy, index) => {
                    if (enemy.hp <= 0 && enemy.maxHp > 0) {
                        // Base drops by enemy type
                        const baseGold = enemy.type === 'weak' ? 5 : enemy.type === 'strong' ? 15 : 10;
                        const baseXP = enemy.type === 'weak' ? 10 : enemy.type === 'strong' ? 30 : 20;
                        
                        // Scale drops with hero level (more rewarding at higher levels)
                        // Level 1: 100%, Level 10: 150%, Level 20: 200%
                        const levelMultiplier = 1 + (this.hero.level - 1) * 0.05;
                        
                        // Scale drops with stage (exponential scaling to match difficulty)
                        // Stage 1: 1.0x, Stage 10: ~2.6x, Stage 20: ~6.7x
                        const stageMultiplier = Math.pow(1.1, this.stageLevel - 1);
                        
                        const goldDrop = Math.floor(baseGold * levelMultiplier * stageMultiplier);
                        const xpDrop = Math.floor(baseXP * levelMultiplier * stageMultiplier);
                        
                        // Spawn gold orbs instead of immediately adding gold
                        this.spawnGoldOrbs(enemy.x, enemy.y, goldDrop);
                        
                        this.hero.addXP(xpDrop);
                        enemy.maxHp = 0; // Mark as dead
                        
                        // Track enemy kill for stage progression
                        this.enemiesKilledThisStage++;
                        
                        // Check for stage advancement
                        if (this.enemiesKilledThisStage >= this.enemiesRequiredPerStage) {
                            this.advanceStage();
                        }
                    }
                });
                
                // Remove dead enemies
                this.enemies = this.enemies.filter(e => e.hp > 0);
                
                // Check hero death
                if (this.hero.hp <= 0) {
                    // Reset or game over (for MVP, just reset)
                    this.hero.hp = this.hero.maxHp;
                }
                
                // Auto-save periodically
                if (Math.random() < 0.01) {
                    this.saveGame();
                }
            }

            render() {
                // Get CSS pixel dimensions (context is scaled by DPR, so we need CSS pixels)
                const cssWidth = this.cssWidth || this.canvas.width / (window.devicePixelRatio || 1);
                const cssHeight = this.cssHeight || this.canvas.height / (window.devicePixelRatio || 1);
                
                // Clear canvas
                this.ctx.fillStyle = '#0a0a0a';
                this.ctx.fillRect(0, 0, cssWidth, cssHeight);
                
                // Draw grid background (optional, for visual reference)
                this.drawGrid();
                
                // Draw trail effects (behind hero)
                this.trailEffects.forEach(effect => {
                    effect.render(this.ctx, this.camera, cssWidth, cssHeight);
                });
                
                // Draw enemies
                this.enemies.forEach(enemy => {
                    enemy.render(this.ctx, this.camera, cssWidth, cssHeight, this.hero);
                });
                
                // Draw hero
                this.hero.render(this.ctx, this.camera, cssWidth, cssHeight);
                
                // Draw attack effects (after hero so they appear on top)
                this.attackEffects.forEach(effect => {
                    effect.render(this.ctx, this.camera, cssWidth, cssHeight);
                });
                
                // Draw whirlwind effects (very visible AoE)
                this.whirlwindEffects.forEach(effect => {
                    effect.render(this.ctx, this.camera, cssWidth, cssHeight);
                });
                
                // Draw damage indicators
                this.damageIndicators.forEach(indicator => {
                    indicator.render(this.ctx, this.camera, cssWidth, cssHeight);
                });
                
                // Draw gold orbs
                this.goldOrbs.forEach(orb => {
                    orb.render(this.ctx);
                });
                
                // Update HUD
                this.updateHUD();
            }

            drawGrid() {
                const cssWidth = this.cssWidth || this.canvas.width / (window.devicePixelRatio || 1);
                const cssHeight = this.cssHeight || this.canvas.height / (window.devicePixelRatio || 1);
                const gridSize = 50;
                const startX = Math.floor((this.camera.x - cssWidth / 2) / gridSize) * gridSize;
                const startY = Math.floor((this.camera.y - cssHeight / 2) / gridSize) * gridSize;
                
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                this.ctx.lineWidth = 1;
                
                for (let x = startX; x < this.camera.x + cssWidth / 2; x += gridSize) {
                    const screen = this.camera.worldToScreen(x, startY, cssWidth, cssHeight);
                    this.ctx.beginPath();
                    this.ctx.moveTo(screen.x, 0);
                    this.ctx.lineTo(screen.x, cssHeight);
                    this.ctx.stroke();
                }
                
                for (let y = startY; y < this.camera.y + cssHeight / 2; y += gridSize) {
                    const screen = this.camera.worldToScreen(startX, y, cssWidth, cssHeight);
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, screen.y);
                    this.ctx.lineTo(cssWidth, screen.y);
                    this.ctx.stroke();
                }
            }

            updateHUD() {
                // Format gold with abbreviated notation (k, m, b, etc.)
                const goldAmount = Math.floor(this.hero.gold);
                document.getElementById('gold').textContent = formatNumber(goldAmount);
                
                // Update XP bar and level text
                const xpNeeded = this.hero.getXPNeeded();
                const xpPercent = Math.min(1, this.hero.xp / xpNeeded);
                const xpBar = document.getElementById('xpBar');
                xpBar.style.width = (xpPercent * 100) + '%';
                
                // Update level text in XP bar
                const xpText = document.getElementById('xpText');
                xpText.textContent = this.hero.level;
                
                // Update stage progression display (Clicker Heroes style)
                this.updateStageProgression();
                
                // Update spell buttons
                const damageButton = document.getElementById('spellDamage');
                const healButton = document.getElementById('spellHeal');
                const placeholderButton = document.getElementById('spellPlaceholder');
                
                this.updateSpellButton(damageButton, this.spells.damage, 'Q');
                this.updateSpellButton(healButton, this.spells.heal, 'W');
                this.updateSpellButton(placeholderButton, this.spells.placeholder, 'E');
            }

            updateStageProgression() {
                const container = document.getElementById('stageProgression');
                container.innerHTML = '';
                
                const currentStage = this.stageLevel;
                const levelsToShow = 3; // Show 1 previous, current, and 1 next
                const startStage = Math.max(1, currentStage - 1);
                
                for (let i = 0; i < levelsToShow; i++) {
                    const stageNum = startStage + i;
                    
                    // Add separator before each stage except the first
                    if (i > 0) {
                        const separator = document.createElement('div');
                        separator.className = 'stage-separator';
                        container.appendChild(separator);
                    }
                    
                    const stageItem = document.createElement('div');
                    stageItem.className = 'stage-item';
                    stageItem.textContent = stageNum;
                    
                    if (stageNum < currentStage) {
                        stageItem.classList.add('prev');
                    } else if (stageNum === currentStage) {
                        stageItem.classList.add('current');
                    } else {
                        stageItem.classList.add('next');
                    }
                    
                    container.appendChild(stageItem);
                }
            }

            updateSpellButton(button, spell, keyLetter) {
                const cooldownPercent = spell.getCooldownPercent();
                const currentCharges = spell.getCharges();
                const maxCharges = spell.getMaxCharges();
                
                // Only show cooldown state if no charges available
                button.classList.toggle('cooldown', currentCharges <= 0);
                
                // Update spell-key text to show cooldown or key letter
                const spellKey = button.querySelector('.spell-key');
                if (spellKey) {
                    if (currentCharges <= 0 && spell.chargeCooldown > 0) {
                        // Show charge cooldown time as whole number when no charges
                        spellKey.textContent = Math.ceil(spell.chargeCooldown).toString();
                    } else {
                        // Show key letter when charges available
                        spellKey.textContent = keyLetter;
                    }
                }
                
                // Update charge indicators - segmented bar design
                let chargeIndicator = button.querySelector('.charge-indicator');
                if (!chargeIndicator) {
                    chargeIndicator = document.createElement('div');
                    chargeIndicator.className = 'charge-indicator';
                    button.appendChild(chargeIndicator);
                }
                
                // Clear existing content
                chargeIndicator.innerHTML = '';
                
                // Create segmented bar showing charges with visible gaps
                for (let i = 0; i < maxCharges; i++) {
                    const segment = document.createElement('div');
                    segment.className = 'charge-segment';
                    
                    // Mark empty segments
                    if (i >= currentCharges) {
                        segment.classList.add('empty');
                    }
                    
                    chargeIndicator.appendChild(segment);
                }
                
                // Update radial cooldown using SVG circle (show when regenerating charge)
                let ring = button.querySelector('.cooldown-ring');
                if (!ring) {
                    ring = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    ring.setAttribute('class', 'cooldown-ring');
                    ring.setAttribute('viewBox', '0 0 100 100');
                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle.setAttribute('cx', '50');
                    circle.setAttribute('cy', '50');
                    circle.setAttribute('r', '45');
                    circle.setAttribute('fill', 'none');
                    circle.setAttribute('stroke', 'rgba(255, 255, 255, 0.6)');
                    circle.setAttribute('stroke-width', '3');
                    circle.setAttribute('stroke-dasharray', '283');
                    circle.setAttribute('stroke-dashoffset', '283');
                    circle.setAttribute('transform', 'rotate(-90 50 50)');
                    circle.setAttribute('class', 'cooldown-circle');
                    ring.appendChild(circle);
                    button.appendChild(ring);
                }
                
                const circle = ring.querySelector('.cooldown-circle');
                if (circle) {
                    // Show cooldown ring when regenerating a charge
                    if (cooldownPercent > 0 && currentCharges < maxCharges) {
                        ring.style.display = 'block';
                        const circumference = 2 * Math.PI * 45;
                        const offset = circumference * (1 - cooldownPercent);
                        circle.setAttribute('stroke-dashoffset', offset.toString());
                    } else {
                        ring.style.display = 'none';
                    }
                }
            }

            saveGame() {
                const saveData = {
                    hero: {
                        x: this.hero.x,
                        y: this.hero.y,
                        level: this.hero.level,
                        xp: this.hero.xp,
                        gold: this.hero.gold,
                        maxHp: this.hero.maxHp,
                        hp: this.hero.hp,
                        armor: this.hero.armor,
                        ad: this.hero.ad,
                        as: this.hero.as,
                        ms: this.hero.ms
                    },
                    gear: {
                        weapon: { level: this.hero.weapon.level },
                        armor: { level: this.hero.armorGear.level },
                        boots: { level: this.hero.boots.level }
                    },
                    stage: {
                        level: this.stageLevel,
                        enemiesKilled: this.enemiesKilledThisStage,
                        enemiesRequired: this.enemiesRequiredPerStage
                    }
                };
                localStorage.setItem('nonstopKnightSave', JSON.stringify(saveData));
            }

            loadGame() {
                const saveData = localStorage.getItem('nonstopKnightSave');
                if (!saveData) return;
                
                try {
                    const data = JSON.parse(saveData);
                    if (data.hero) {
                        this.hero.level = data.hero.level || 1;
                        this.hero.xp = data.hero.xp || 0;
                        this.hero.gold = data.hero.gold || 0;
                        this.hero.maxHp = data.hero.maxHp || 100;
                        this.hero.armor = data.hero.armor || 0;
                        this.hero.ad = data.hero.ad || 10;
                        this.hero.as = data.hero.as || 1.0;
                        this.hero.ms = data.hero.ms || 100;
                    }
                    if (data.gear) {
                        if (data.gear.weapon && typeof data.gear.weapon === 'object') {
                            this.hero.weapon.level = data.gear.weapon.level || 1;
                        }
                        if (data.gear.armor && typeof data.gear.armor === 'object') {
                            this.hero.armorGear.level = data.gear.armor.level || 1;
                        }
                        if (data.gear.boots && typeof data.gear.boots === 'object') {
                            this.hero.boots.level = data.gear.boots.level || 1;
                        }
                        this.hero.updateStats();
                    }
                    // Ensure hero starts with full HP after loading
                    this.hero.hp = this.hero.maxHp;
                    if (data.stage) {
                        this.stageLevel = data.stage.level || 1;
                        this.enemiesKilledThisStage = data.stage.enemiesKilled || 0;
                        this.enemiesRequiredPerStage = data.stage.enemiesRequired || 10;
                    }
                } catch (e) {
                    console.error('Failed to load save:', e);
                }
            }
            
            resetGame() {
                // Reset hero stats
                this.hero.level = 1;
                this.hero.xp = 0;
                this.hero.gold = 0;
                this.hero.maxHp = 100;
                this.hero.hp = 100;
                this.hero.armor = 0;
                this.hero.ad = 10;
                this.hero.as = 1.0;
                this.hero.ms = 100;
                
                // Reset gear levels
                this.hero.weapon.level = 1;
                this.hero.armorGear.level = 1;
                this.hero.boots.level = 1;
                this.hero.updateStats();
                
                // Reset stage
                this.stageLevel = 1;
                this.enemiesKilledThisStage = 0;
                this.enemiesRequiredPerStage = 10;
                
                // Clear enemies
                this.enemies = [];
                
                // Reset ability stacks
                this.hero.chargeStacks = 0;
                this.hero.chargeUpTime = 0;
                this.hero.attackSpeedBoostTime = 0;
                this.hero.enlargeStacks = 0;
                this.hero.enlargeTime = 0;
                
                // Reset spawn interval
                this.spawnInterval = 2.0;
                this.lastSpawnTime = 0;
                
                // Clear all effects
                this.damageIndicators = [];
                this.attackEffects = [];
                this.trailEffects = [];
                this.whirlwindEffects = [];
                this.goldOrbs = [];
                
                // Clear save data
                localStorage.removeItem('nonstopKnightSave');
                
                // Spawn first enemy
                this.spawnEnemy();
                
                // Update UI
                this.updateShopUI();
                this.updateInventoryUI();
            }

            gameLoop(currentTime) {
                const dt = (currentTime - this.lastTime) / 1000;
                this.lastTime = currentTime;
                
                // Cap delta time to prevent large jumps
                const cappedDt = Math.min(dt, 0.1);
                
                // UPDATE: All game logic first
                this.update(cappedDt);
                
                // RENDER: All drawing second
                this.render();
                
                requestAnimationFrame((time) => this.gameLoop(time));
            }
        }

// Start game when page loads
window.addEventListener('load', () => {
    new Game();
});