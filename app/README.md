# Cấu trúc ứng dụng Blog Platform - Refactored

## Cấu trúc thư mục

```
app/
├── app.js                 # Entry point chính
├── package.json          # Dependencies
├── config/               # Cấu hình
│   ├── database.js       # Cấu hình database MySQL
│   └── aws.js           # Cấu hình AWS services
├── middleware/           # Middleware
│   └── auth.js          # JWT authentication middleware
├── services/             # Business logic
│   ├── blogService.js   # Logic xử lý blog
│   ├── s3Service.js     # Logic upload S3
│   └── templateService.js # Template rendering service
└── routes/              # API routes và views
    ├── api.js           # API endpoints (/api/*)
    ├── views.js         # View routes (HTML pages)
    └── templates/       # HTML templates
        ├── index.html   # Main blog page template
        └── error.html   # Error page template
```

## Mô tả các thành phần

### 1. Config Layer (`config/`)
- **database.js**: Quản lý kết nối database MySQL, tạo tables
- **aws.js**: Cấu hình AWS services (Cognito, S3, CloudFront)

### 2. Middleware Layer (`middleware/`)
- **auth.js**: Xác thực JWT token từ AWS Cognito

### 3. Service Layer (`services/`)
- **blogService.js**: Business logic cho blog operations (CRUD)
- **s3Service.js**: Logic upload file lên S3
- **templateService.js**: Template rendering với variable substitution

### 4. Route Layer (`routes/`)
- **api.js**: API endpoints cho blog operations
- **views.js**: Routes trả về HTML pages
- **templates/**: HTML template files với placeholder variables

### 5. Template System (`routes/templates/`)
- **index.html**: Main blog page với Bootstrap UI
- **error.html**: Error page template
- Template variables: `{{VARIABLE_NAME}}` syntax

### 5. Main App (`app.js`)
- Entry point chính
- Kết nối các layer lại với nhau
- Khởi tạo server

## Ưu điểm của cấu trúc mới

1. **Separation of Concerns**: Mỗi layer có trách nhiệm riêng biệt
2. **Maintainability**: Dễ bảo trì và debug
3. **Scalability**: Dễ mở rộng thêm features
4. **Testability**: Dễ viết unit tests cho từng service
5. **Reusability**: Services có thể tái sử dụng
6. **Template Management**: HTML templates tách biệt, dễ chỉnh sửa
7. **Variable Injection**: Dynamic content với template variables

## Template System

### Template Variables
Templates sử dụng syntax `{{VARIABLE_NAME}}` để inject dynamic content:

```html
<title>{{PAGE_TITLE}}</title>
<div>Welcome {{USER_NAME}}</div>
```

### Template Service Features
- **Variable Substitution**: Replace placeholders với actual values
- **Error Handling**: Graceful fallback khi template không tồn tại
- **Config Integration**: Tự động inject environment variables
- **File-based**: Templates stored as separate HTML files

## Cách chạy ứng dụng

```bash
cd app
npm install
npm start
```

## Environment Variables cần thiết

```
DB_HOST=your-rds-endpoint
DB_USER=admin
DB_PASSWORD=your-password
DB_NAME=blog_db
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=your-pool-id
COGNITO_CLIENT_ID=your-client-id
CLOUDFRONT_DOMAIN=your-cloudfront-domain
S3_BUCKET_NAME=your-s3-bucket
```
