-- =====================================================
-- نظام المحاسبة ونقاط البيع - SQL Server Schema
-- POS & Accounting System - T-SQL Database Schema
-- =====================================================

-- Create Database (run this separately as admin)
-- CREATE DATABASE POSAccountingDB;
-- GO
-- USE POSAccountingDB;
-- GO

-- =====================================================
-- جدول المنتجات / Products Table
-- =====================================================
CREATE TABLE Products (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    barcode NVARCHAR(50) NOT NULL UNIQUE,
    trade_name NVARCHAR(200) NOT NULL,           -- الاسم التجاري
    scientific_name NVARCHAR(300),                -- الاسم العلمي
    category NVARCHAR(100),                       -- التصنيف
    stock_quantity INT NOT NULL DEFAULT 0,        -- الكمية المتوفرة
    min_stock INT NOT NULL DEFAULT 10,            -- الحد الأدنى للمخزون
    cost_price DECIMAL(18,2) NOT NULL DEFAULT 0,  -- سعر التكلفة
    sale_price DECIMAL(18,2) NOT NULL DEFAULT 0,  -- سعر البيع
    expiry_date DATE,                             -- تاريخ الانتهاء
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    
    -- Index for faster barcode lookup
    INDEX IX_Products_Barcode (barcode),
    INDEX IX_Products_TradeName (trade_name),
    INDEX IX_Products_Category (category),
    INDEX IX_Products_ExpiryDate (expiry_date)
);
GO

-- =====================================================
-- جدول جهات الاتصال / Contacts Table (Customers & Suppliers)
-- =====================================================
CREATE TABLE Contacts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    contact_type NVARCHAR(20) NOT NULL CHECK (contact_type IN ('customer', 'supplier')), -- نوع جهة الاتصال
    name NVARCHAR(200) NOT NULL,                  -- الاسم
    phone NVARCHAR(20),                           -- رقم الهاتف
    email NVARCHAR(100),                          -- البريد الإلكتروني
    address NVARCHAR(500),                        -- العنوان
    tax_number NVARCHAR(50),                      -- الرقم الضريبي
    balance DECIMAL(18,2) NOT NULL DEFAULT 0,     -- الرصيد (موجب = له، سالب = عليه)
    credit_limit DECIMAL(18,2) DEFAULT 0,         -- حد الائتمان
    is_active BIT NOT NULL DEFAULT 1,
    notes NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    
    INDEX IX_Contacts_Type (contact_type),
    INDEX IX_Contacts_Name (name),
    INDEX IX_Contacts_Phone (phone)
);
GO

-- =====================================================
-- جدول الفواتير / Invoices Table (Sales & Purchases Header)
-- =====================================================
CREATE TABLE Invoices (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    invoice_number NVARCHAR(50) NOT NULL UNIQUE,  -- رقم الفاتورة
    invoice_type NVARCHAR(20) NOT NULL CHECK (invoice_type IN ('sale', 'purchase', 'sale_return', 'purchase_return')), -- نوع الفاتورة
    contact_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Contacts(id),
    invoice_date DATE NOT NULL DEFAULT GETDATE(), -- تاريخ الفاتورة
    subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,    -- المجموع قبل الضريبة
    tax_amount DECIMAL(18,2) NOT NULL DEFAULT 0,  -- قيمة الضريبة
    discount_amount DECIMAL(18,2) NOT NULL DEFAULT 0, -- قيمة الخصم
    total DECIMAL(18,2) NOT NULL DEFAULT 0,       -- الإجمالي
    paid_amount DECIMAL(18,2) NOT NULL DEFAULT 0, -- المبلغ المدفوع
    status NVARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')), -- حالة الفاتورة
    payment_method NVARCHAR(20),                  -- طريقة الدفع
    notes NVARCHAR(MAX),
    created_by NVARCHAR(100),                     -- المستخدم
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    
    INDEX IX_Invoices_Number (invoice_number),
    INDEX IX_Invoices_Type (invoice_type),
    INDEX IX_Invoices_Date (invoice_date),
    INDEX IX_Invoices_ContactId (contact_id),
    INDEX IX_Invoices_Status (status)
);
GO

-- =====================================================
-- جدول تفاصيل الفاتورة / Invoice Items Table (Sales & Purchases Lines)
-- =====================================================
CREATE TABLE InvoiceItems (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    invoice_id UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Invoices(id) ON DELETE CASCADE,
    product_id UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Products(id),
    quantity INT NOT NULL,                        -- الكمية
    unit_price DECIMAL(18,2) NOT NULL,            -- سعر الوحدة
    discount DECIMAL(18,2) NOT NULL DEFAULT 0,    -- الخصم
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,     -- نسبة الضريبة
    total DECIMAL(18,2) NOT NULL,                 -- الإجمالي
    batch_number NVARCHAR(50),                    -- رقم الدفعة
    expiry_date DATE,                             -- تاريخ الانتهاء
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    
    INDEX IX_InvoiceItems_InvoiceId (invoice_id),
    INDEX IX_InvoiceItems_ProductId (product_id)
);
GO

-- =====================================================
-- دفتر الحسابات / Ledger Table (Accounting Journal)
-- =====================================================
CREATE TABLE Ledger (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    entry_date DATE NOT NULL DEFAULT GETDATE(),   -- تاريخ القيد
    entry_type NVARCHAR(20) NOT NULL CHECK (entry_type IN ('income', 'expense', 'transfer')), -- نوع القيد
    description NVARCHAR(500) NOT NULL,           -- الوصف
    amount DECIMAL(18,2) NOT NULL,                -- المبلغ
    running_balance DECIMAL(18,2) NOT NULL,       -- الرصيد الجاري
    reference_type NVARCHAR(50),                  -- نوع المرجع (invoice, payment, adjustment)
    reference_id UNIQUEIDENTIFIER,                -- معرف المرجع
    contact_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Contacts(id),
    account_type NVARCHAR(50),                    -- نوع الحساب
    created_by NVARCHAR(100),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    
    INDEX IX_Ledger_Date (entry_date),
    INDEX IX_Ledger_Type (entry_type),
    INDEX IX_Ledger_ReferenceId (reference_id),
    INDEX IX_Ledger_ContactId (contact_id)
);
GO

-- =====================================================
-- جدول المستخدمين / Users Table
-- =====================================================
CREATE TABLE Users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    username NVARCHAR(50) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,         -- كلمة المرور المشفرة
    full_name NVARCHAR(200) NOT NULL,
    email NVARCHAR(100),
    phone NVARCHAR(20),
    role NVARCHAR(20) NOT NULL DEFAULT 'cashier' CHECK (role IN ('admin', 'manager', 'cashier')),
    is_active BIT NOT NULL DEFAULT 1,
    last_login DATETIME2,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    
    INDEX IX_Users_Username (username),
    INDEX IX_Users_Role (role)
);
GO

-- =====================================================
-- جدول إعدادات النظام / System Settings Table
-- =====================================================
CREATE TABLE Settings (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    setting_key NVARCHAR(100) NOT NULL UNIQUE,
    setting_value NVARCHAR(MAX),
    setting_type NVARCHAR(50) NOT NULL DEFAULT 'string',
    description NVARCHAR(500),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- =====================================================
-- Stored Procedures
-- =====================================================

-- إنشاء فاتورة بيع مع تحديث المخزون
CREATE PROCEDURE sp_CreateSaleInvoice
    @ContactId UNIQUEIDENTIFIER = NULL,
    @PaymentMethod NVARCHAR(20) = 'cash',
    @PaidAmount DECIMAL(18,2) = 0,
    @CreatedBy NVARCHAR(100) = NULL,
    @InvoiceId UNIQUEIDENTIFIER OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @InvoiceNumber NVARCHAR(50);
    
    -- Generate invoice number
    SET @InvoiceNumber = 'INV-' + FORMAT(GETDATE(), 'yyyyMMdd') + '-' + 
                         RIGHT('0000' + CAST((SELECT COUNT(*) + 1 FROM Invoices 
                         WHERE CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)) AS NVARCHAR), 4);
    
    SET @InvoiceId = NEWID();
    
    INSERT INTO Invoices (id, invoice_number, invoice_type, contact_id, payment_method, paid_amount, created_by)
    VALUES (@InvoiceId, @InvoiceNumber, 'sale', @ContactId, @PaymentMethod, @PaidAmount, @CreatedBy);
    
    SELECT @InvoiceId AS InvoiceId, @InvoiceNumber AS InvoiceNumber;
END;
GO

-- إضافة بند للفاتورة مع تحديث المخزون
CREATE PROCEDURE sp_AddInvoiceItem
    @InvoiceId UNIQUEIDENTIFIER,
    @ProductId UNIQUEIDENTIFIER,
    @Quantity INT,
    @UnitPrice DECIMAL(18,2) = NULL,
    @Discount DECIMAL(18,2) = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ActualPrice DECIMAL(18,2);
    DECLARE @Total DECIMAL(18,2);
    DECLARE @InvoiceType NVARCHAR(20);
    
    -- Get invoice type
    SELECT @InvoiceType = invoice_type FROM Invoices WHERE id = @InvoiceId;
    
    -- Get product price if not provided
    IF @UnitPrice IS NULL
    BEGIN
        IF @InvoiceType IN ('sale', 'sale_return')
            SELECT @ActualPrice = sale_price FROM Products WHERE id = @ProductId;
        ELSE
            SELECT @ActualPrice = cost_price FROM Products WHERE id = @ProductId;
    END
    ELSE
        SET @ActualPrice = @UnitPrice;
    
    SET @Total = (@Quantity * @ActualPrice) - @Discount;
    
    -- Insert item
    INSERT INTO InvoiceItems (invoice_id, product_id, quantity, unit_price, discount, total)
    VALUES (@InvoiceId, @ProductId, @Quantity, @ActualPrice, @Discount, @Total);
    
    -- Update stock
    IF @InvoiceType IN ('sale', 'purchase_return')
        UPDATE Products SET stock_quantity = stock_quantity - @Quantity, updated_at = GETDATE() WHERE id = @ProductId;
    ELSE
        UPDATE Products SET stock_quantity = stock_quantity + @Quantity, updated_at = GETDATE() WHERE id = @ProductId;
    
    -- Update invoice totals
    UPDATE Invoices 
    SET subtotal = (SELECT ISNULL(SUM(total), 0) FROM InvoiceItems WHERE invoice_id = @InvoiceId),
        total = (SELECT ISNULL(SUM(total), 0) FROM InvoiceItems WHERE invoice_id = @InvoiceId),
        updated_at = GETDATE()
    WHERE id = @InvoiceId;
END;
GO

-- الحصول على المنتجات قليلة المخزون
CREATE PROCEDURE sp_GetLowStockProducts
AS
BEGIN
    SELECT * FROM Products 
    WHERE stock_quantity <= min_stock AND is_active = 1
    ORDER BY stock_quantity ASC;
END;
GO

-- الحصول على المنتجات قريبة الانتهاء
CREATE PROCEDURE sp_GetExpiringProducts
    @DaysAhead INT = 90
AS
BEGIN
    SELECT * FROM Products 
    WHERE expiry_date <= DATEADD(DAY, @DaysAhead, GETDATE()) 
      AND expiry_date >= GETDATE()
      AND is_active = 1
    ORDER BY expiry_date ASC;
END;
GO

-- =====================================================
-- Views
-- =====================================================

-- عرض ملخص المبيعات اليومية
CREATE VIEW vw_DailySalesSummary AS
SELECT 
    CAST(invoice_date AS DATE) AS sale_date,
    COUNT(*) AS invoice_count,
    SUM(total) AS total_sales,
    SUM(paid_amount) AS total_paid,
    SUM(total - paid_amount) AS total_outstanding
FROM Invoices
WHERE invoice_type = 'sale' AND status != 'cancelled'
GROUP BY CAST(invoice_date AS DATE);
GO

-- عرض حركة المخزون
CREATE VIEW vw_ProductInventory AS
SELECT 
    p.id,
    p.barcode,
    p.trade_name,
    p.scientific_name,
    p.category,
    p.stock_quantity,
    p.min_stock,
    p.cost_price,
    p.sale_price,
    p.expiry_date,
    (p.stock_quantity * p.cost_price) AS inventory_value,
    CASE 
        WHEN p.stock_quantity <= p.min_stock THEN 'low'
        WHEN p.stock_quantity <= p.min_stock * 2 THEN 'medium'
        ELSE 'good'
    END AS stock_status,
    CASE 
        WHEN p.expiry_date <= GETDATE() THEN 'expired'
        WHEN p.expiry_date <= DATEADD(MONTH, 3, GETDATE()) THEN 'expiring_soon'
        ELSE 'good'
    END AS expiry_status
FROM Products p
WHERE p.is_active = 1;
GO

-- =====================================================
-- Sample Data / بيانات تجريبية
-- =====================================================

-- Insert default admin user
INSERT INTO Users (username, password_hash, full_name, role)
VALUES ('admin', 'CHANGE_THIS_HASH', N'مدير النظام', 'admin');

-- Insert default settings
INSERT INTO Settings (setting_key, setting_value, setting_type, description)
VALUES 
    ('company_name', N'صيدلية المستقبل', 'string', N'اسم الشركة'),
    ('tax_rate', '15', 'number', N'نسبة ضريبة القيمة المضافة'),
    ('currency', 'SAR', 'string', N'العملة'),
    ('low_stock_alert', '10', 'number', N'تنبيه نقص المخزون'),
    ('expiry_alert_days', '90', 'number', N'تنبيه قبل الانتهاء بأيام');

-- Insert sample contact (cash customer)
INSERT INTO Contacts (id, contact_type, name, phone)
VALUES (NEWID(), 'customer', N'عميل نقدي', '');
GO

PRINT N'تم إنشاء قاعدة البيانات بنجاح';
PRINT N'Database created successfully';
GO