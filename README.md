# Iwanyu Vendor Dashboard

A modern, full-featured vendor dashboard built with Next.js 15, Supabase, and TypeScript.

## ✨ Features

### 🛍️ **Product Management**
- **Create Products**: Add products with comprehensive details
- **Image Upload**: Multi-image upload with preview and primary image selection
- **Image Export**: Download original uploaded images
- **Product Catalog**: View and manage all products
- **Status Management**: Active/Draft product status
- **Inventory Tracking**: Stock quantity management

### 📸 **Advanced Image System**
- **Live Preview**: See image thumbnails during upload
- **Primary Selection**: Click to choose main product image
- **Robust Storage**: Multi-layer backup system ensures images are never lost
- **Original Quality**: Images stored without compression
- **Export Functionality**: Download original images anytime

### 🎯 **User Experience**
- **Responsive Design**: Works on desktop and mobile
- **Real-time Feedback**: Upload progress and status indicators
- **Error Handling**: Comprehensive error recovery
- **Clean Interface**: Modern, intuitive design

## 🚀 Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Supabase (PostgreSQL, Storage, Auth)
- **Styling**: Tailwind CSS, Radix UI
- **Deployment**: Vercel
- **Testing**: Jest, Playwright

## 📁 Project Structure

```
iwanyu-dashboard/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── vendor/            # Vendor dashboard pages
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   └── vendor/           # Vendor-specific components
├── lib/                  # Utility libraries
├── hooks/                # Custom React hooks
├── styles/               # Global styles
├── public/               # Static assets
└── utils/                # Helper utilities
```

## 🛠️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/vincinci/iwanyu_vendor_dashboard.git
   cd iwanyu_vendor_dashboard
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Run development server**
   ```bash
   pnpm dev
   ```

5. **Visit the application**
   ```
   http://localhost:3000
   ```

## 🏗️ Database Setup

The application uses Supabase with the following main tables:
- `profiles` - User profile information
- `products` - Product catalog
- `vendor_stores` - Vendor store information

See `SETUP_GUIDE.md` for detailed setup instructions.

## 📸 Image Storage

The application features a robust multi-layer image storage system:

1. **Primary Storage**: Supabase `product-images` bucket
2. **Backup Storage**: Supabase `vendor-uploads` bucket  
3. **Cloud Backup**: API-based backup system

This ensures vendor images are always preserved, even if primary storage fails.

## 🚢 Deployment

The application is configured for Vercel deployment:

```bash
pnpm build
vercel --prod
```

See `DEPLOYMENT_CHECKLIST.md` for production deployment guidelines.

## 🧪 Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# All tests
pnpm test:all
```

## 📚 Documentation

- [`SETUP_GUIDE.md`](./SETUP_GUIDE.md) - Detailed setup instructions
- [`DEPLOYMENT_CHECKLIST.md`](./DEPLOYMENT_CHECKLIST.md) - Production deployment guide
- [`MANUAL_TESTING_GUIDE.md`](./MANUAL_TESTING_GUIDE.md) - Testing procedures
- [`PRODUCTION_OPTIMIZATION.md`](./PRODUCTION_OPTIMIZATION.md) - Performance optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Create an issue in the GitHub repository
- Check the documentation files
- Review the setup guide

---

Built with ❤️ for vendors who need a reliable, modern dashboard solution.
