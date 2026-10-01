# EC2 Redeploy Guide — World Space Week 2026 Quiz

If your sandbox expired or you need a fresh EC2 instance, follow these steps exactly.

---

## Step 1: Launch a new EC2 instance

1. Go to AWS Console → EC2 → Launch Instance
2. Settings:
   - **Name:** space-quiz
   - **AMI:** Amazon Linux 2023
   - **Instance type:** t3.micro (free tier eligible)
   - **Key pair:** Create new or reuse existing `.pem` file
   - **Security group:** Create new, add these inbound rules:
     - SSH (port 22) — Source: My IP
     - Custom TCP (port 3001) — Source: Anywhere IPv4 (0.0.0.0/0)
3. Click Launch Instance
4. Note down the **Public IP** or allocate an **Elastic IP** (EC2 → Elastic IPs → Allocate → Associate)

---

## Step 2: SSH into the instance

Replace `YOUR_KEY.pem` and `YOUR_IP` with your actual values:

```bash
ssh -i ~/Downloads/YOUR_KEY.pem ec2-user@YOUR_IP
```

If you get a permissions error on the key file:
```bash
chmod 400 ~/Downloads/YOUR_KEY.pem
```

---

## Step 3: Install Node.js

```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
```

Verify:
```bash
node --version
npm --version
```

---

## Step 4: Install Git

```bash
sudo dnf install -y git
```

---

## Step 5: Clone the repo

```bash
cd ~
git clone https://github.com/Sufi-S/world-space-week-2026-quiz.git
cd world-space-week-2026-quiz
```

---

## Step 6: Install dependencies and build frontend

```bash
npm run setup
```

This runs: server npm install → client npm install → client build.

---

## Step 7: Quick test (optional)

```bash
npm start
```

Open `http://YOUR_IP:3001` in browser. If it loads, press Ctrl+C to stop.

---

## Step 8: Install PM2 and start the app

```bash
sudo npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

PM2 startup will print a `sudo env PATH=...` command. **Copy and paste that entire command and run it.** It will look like:

```bash
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user
```

---

## Step 9: Set up GitHub token for backups

### Generate a token:
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token → scope: `repo` → copy the token

### Save it on EC2:

**Replace YOUR_TOKEN with your actual token:**

```bash
echo 'GITHUB_TOKEN=YOUR_TOKEN' > ~/.env_quiz_backup
chmod 600 ~/.env_quiz_backup
```

### Set git identity:

```bash
git config --global user.email "azam.s.sufiyan@gmail.com"
git config --global user.name "Sufi-S"
```

---

## Step 10: Set up nightly backup cron job

### Install cron:

```bash
sudo dnf install -y cronie
sudo systemctl enable crond
sudo systemctl start crond
```

### Make backup script executable:

```bash
chmod +x scripts/backup.sh
```

### Add cron job:

```bash
crontab -e
```

Press `i`, paste this line:

```
0 18 * * * /home/ec2-user/world-space-week-2026-quiz/scripts/backup.sh >> /home/ec2-user/world-space-week-2026-quiz/logs/backup.log 2>&1
```

Press `Esc`, type `:wq`, press `Enter`.

### Test backup works:

```bash
bash scripts/backup.sh
```

You should see "Backup pushed successfully" or "No changes — skipping backup".

---

## Step 11: Verify everything

```bash
pm2 status
```

Should show `space-quiz` with status `online`.

Open `http://YOUR_IP:3001` in browser — quiz app should load with all 1,655 questions.

---

## Done! Your app is live again.

### Useful PM2 commands:

| Command | What it does |
|---------|-------------|
| `pm2 status` | Check if app is running |
| `pm2 logs` | View app logs |
| `pm2 restart space-quiz` | Restart the app |
| `pm2 stop space-quiz` | Stop the app |

### Total time: ~5 minutes
