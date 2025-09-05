# Ultra-Simple Directus Deployment

## What You Need to Do (2 Steps Only)

### Step 1: Upload the Script
```bash
# From your Mac, upload the script to your Ubuntu server
scp deploy-directus.sh user@your-server-ip:~/
```

### Step 2: Run the Script
```bash
# SSH into your server and run
ssh user@your-server-ip
chmod +x deploy-directus.sh
./deploy-directus.sh
```

**That's it!** The script does everything automatically:
- ✅ Detects your server IP
- ✅ Finds available port (if 8055 is taken)
- ✅ Installs Docker (if needed)
- ✅ Generates secure passwords and keys
- ✅ Creates isolated directory structure
- ✅ Configures firewall
- ✅ Downloads and starts Directus
- ✅ Creates backup script
- ✅ Tests everything works

## What You'll Get

After 2-3 minutes, you'll see:
```
🎉 DEPLOYMENT COMPLETE!
==================================
Admin Panel URL: http://YOUR-IP:8055
Admin Email: admin@asha.news
Admin Password: [generated-password]
==================================
```

## If You Want SSH Access for Me

Instead of you doing the 2 steps above, you can:

1. **Give me SSH access**: `ssh user@your-server-ip` details
2. **I'll run the script** and handle everything
3. **You get the admin URL** and credentials when done

This way you literally do nothing except provide SSH access.

## Safety Features

- ✅ **Won't break existing services** (isolated containers)
- ✅ **Resource limited** (max 1GB RAM, 0.5 CPU)
- ✅ **Port conflict detection** (finds free port automatically)
- ✅ **Easy to remove** (single command: `docker-compose down -v`)

Choose your preference:
- **Option A**: You run 2 commands above
- **Option B**: Give me SSH access and I handle everything
