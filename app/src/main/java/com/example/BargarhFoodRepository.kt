package com.example

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.util.UUID

class BargarhFoodRepository {
    private val mutex = Mutex()

    private val _businesses = MutableStateFlow<List<Business>>(initialBusinesses())
    val businesses = _businesses.asStateFlow()

    private val _products = MutableStateFlow<List<Product>>(initialProducts())
    val products = _products.asStateFlow()

    private val _orders = MutableStateFlow<List<Order>>(initialOrders())
    val orders = _orders.asStateFlow()

    private val _auditLogs = MutableStateFlow<List<AuditLogEntry>>(initialAuditLogs())
    val auditLogs = _auditLogs.asStateFlow()

    // Businesses
    suspend fun getApprovedBusinesses(): List<Business> = mutex.withLock {
        _businesses.value.filter { it.status == "APPROVED" }
    }

    suspend fun getAllBusinesses(): List<Business> = mutex.withLock {
        _businesses.value
    }

    suspend fun getBusinessById(businessId: String): Business? = mutex.withLock {
        _businesses.value.find { it.businessId == businessId }
    }

    suspend fun createOrUpdateBusiness(business: Business): Boolean = mutex.withLock {
        val current = _businesses.value.toMutableList()
        val index = current.indexOfFirst { it.businessId == business.businessId }
        if (index >= 0) {
            current[index] = business
        } else {
            current.add(business)
        }
        _businesses.value = current
        true
    }

    // Products
    suspend fun getProductsForBusiness(businessId: String): List<Product> = mutex.withLock {
        _products.value.filter { it.businessId == businessId && it.availability }
    }

    suspend fun getAllProductsForBusiness(businessId: String): List<Product> = mutex.withLock {
        _products.value.filter { it.businessId == businessId }
    }

    suspend fun addProduct(product: Product): Boolean = mutex.withLock {
        val current = _products.value.toMutableList()
        current.add(product)
        _products.value = current
        true
    }

    suspend fun updateProduct(product: Product): Boolean = mutex.withLock {
        val current = _products.value.toMutableList()
        val index = current.indexOfFirst { it.productId == product.productId }
        if (index >= 0) {
            current[index] = product
            _products.value = current
            true
        } else {
            false
        }
    }

    suspend fun deleteProduct(productId: String): Boolean = mutex.withLock {
        val current = _products.value.toMutableList()
        val removed = current.removeAll { it.productId == productId }
        if (removed) {
            _products.value = current
        }
        removed
    }

    // Orders (COD Only for Bargarh city)
    suspend fun createOrder(order: Order): Boolean = mutex.withLock {
        val current = _orders.value.toMutableList()
        current.add(0, order)
        _orders.value = current
        true
    }

    suspend fun getOrderById(orderId: String): Order? = mutex.withLock {
        _orders.value.find { it.orderId.equals(orderId.trim(), ignoreCase = true) }
    }

    // Strict multi-restaurant isolation: Owner sees ONLY their assigned business orders
    suspend fun getOrdersForBusiness(businessId: String): List<Order> = mutex.withLock {
        _orders.value.filter { it.businessId == businessId }
    }

    // Admin sees all orders
    suspend fun getAllOrders(): List<Order> = mutex.withLock {
        _orders.value
    }

    suspend fun updateOrderStatus(orderId: String, newStatus: String): Boolean = mutex.withLock {
        val current = _orders.value.toMutableList()
        val index = current.indexOfFirst { it.orderId == orderId }
        if (index >= 0) {
            current[index] = current[index].copy(orderStatus = newStatus)
            _orders.value = current
            true
        } else {
            false
        }
    }

    // Audit logs
    suspend fun getAuditLogs(): List<AuditLogEntry> = mutex.withLock {
        _auditLogs.value
    }

    suspend fun recordAudit(action: String, entityType: String, entityId: String, details: String) = mutex.withLock {
        val current = _auditLogs.value.toMutableList()
        current.add(0, AuditLogEntry(
            action = action,
            entityType = entityType,
            entityId = entityId,
            details = details
        ))
        _auditLogs.value = current
    }

    companion object {
        fun initialBusinesses(): List<Business> = listOf(
            Business(
                businessId = "rest-bargarh-biryani",
                name = "Bargarh Biryani Mahal",
                description = "Authentic Dum Biryani, Chicken Tikka & Kebabs of Bargarh",
                category = "Biryani",
                phone = "+91 94370 12345",
                address = "Main Road, Near Gandhi Chowk, Bargarh",
                coverImageUrl = "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
                logoUrl = "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200",
                status = "APPROVED",
                isFeatured = true,
                deliveryFee = 30.0,
                minOrderAmount = 150.0,
                openingHours = "11:00 AM - 10:30 PM",
                commissionPercentage = 10.0,
                ownerId = "owner-1"
            ),
            Business(
                businessId = "rest-samaleswari-tiffin",
                name = "Maa Samaleswari Tiffin Stall",
                description = "Famous Odia Tiffin, Chakuli & Dalma, Bara & Puri Sabji",
                category = "Tiffin",
                phone = "+91 98610 23456",
                address = "Canal Avenue, Ward 4, Bargarh",
                coverImageUrl = "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800",
                logoUrl = "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=200",
                status = "APPROVED",
                isFeatured = true,
                deliveryFee = 20.0,
                minOrderAmount = 80.0,
                openingHours = "07:00 AM - 01:00 PM & 04:30 PM - 09:30 PM",
                commissionPercentage = 8.0,
                ownerId = "owner-2"
            ),
            Business(
                businessId = "rest-bhatli-fastfood",
                name = "Bhatli Chowk Fast Food Corner",
                description = "Crispy Burgers, Veg & Egg Rolls, Chowmein & Momos",
                category = "Fast Food",
                phone = "+91 70081 34567",
                address = "Bhatli Chowk, Near Overbridge, Bargarh",
                coverImageUrl = "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800",
                logoUrl = "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=200",
                status = "APPROVED",
                isFeatured = false,
                deliveryFee = 25.0,
                minOrderAmount = 100.0,
                openingHours = "12:00 PM - 10:00 PM",
                commissionPercentage = 10.0,
                ownerId = "owner-3"
            ),
            Business(
                businessId = "rest-radha-krishna-sweets",
                name = "Radha Krishna Sweets & Chaat",
                description = "Authentic Chenapoda, Rasagola, Samosa Chaat & Dahi Vada",
                category = "Sweets",
                phone = "+91 99372 45678",
                address = "Daily Market Road, Ward 8, Bargarh",
                coverImageUrl = "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800",
                logoUrl = "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200",
                status = "APPROVED",
                isFeatured = true,
                deliveryFee = 20.0,
                minOrderAmount = 100.0,
                openingHours = "08:00 AM - 10:00 PM",
                commissionPercentage = 10.0,
                ownerId = "owner-4"
            )
        )

        fun initialProducts(): List<Product> = listOf(
            Product(
                productId = "prod-1",
                businessId = "rest-bargarh-biryani",
                categoryId = "Biryani",
                name = "Special Chicken Dum Biryani",
                description = "Slow cooked fragrant long-grain rice with succulent chicken pieces & raita",
                price = 210.0,
                imageUrl = "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500",
                availability = true,
                isVeg = false
            ),
            Product(
                productId = "prod-2",
                businessId = "rest-bargarh-biryani",
                categoryId = "Biryani",
                name = "Hyderabadi Veg Biryani",
                description = "Aromatic rice cooked with fresh seasonal vegetables and spiced paneer",
                price = 160.0,
                imageUrl = "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500",
                availability = true,
                isVeg = true
            ),
            Product(
                productId = "prod-3",
                businessId = "rest-samaleswari-tiffin",
                categoryId = "Tiffin",
                name = "Bargarh Special Chakuli & Dalma",
                description = "Traditional Odia soft fermented rice pancakes with authentic dalma",
                price = 60.0,
                imageUrl = "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500",
                availability = true,
                isVeg = true
            ),
            Product(
                productId = "prod-4",
                businessId = "rest-bhatli-fastfood",
                categoryId = "Momo",
                name = "Steamed Veg Momo (8 Pcs)",
                description = "Handcrafted delicate momos with fiery Bargarh red garlic chutney",
                price = 80.0,
                imageUrl = "https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=500",
                availability = true,
                isVeg = true
            ),
            Product(
                productId = "prod-5",
                businessId = "rest-radha-krishna-sweets",
                categoryId = "Sweets",
                name = "Authentic Chenapoda (250g)",
                description = "Traditional baked cottage cheese sweet with cardamom and caramelized crust",
                price = 120.0,
                imageUrl = "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500",
                availability = true,
                isVeg = true
            )
        )

        fun initialOrders(): List<Order> = listOf(
            Order(
                orderId = "BF-49201",
                customerName = "Rahul Mishra",
                customerPhone = "9861012345",
                businessId = "rest-bargarh-biryani",
                businessName = "Bargarh Biryani Mahal",
                deliveryAddress = "Canal Avenue, Ward 4, Near Shiva Mandir, Bargarh",
                items = listOf(
                    OrderItem(
                        productId = "prod-1",
                        productName = "Special Chicken Dum Biryani",
                        priceAtPurchase = 210.0,
                        quantity = 1,
                        subtotal = 210.0
                    )
                ),
                subtotal = 210.0,
                deliveryFee = 30.0,
                total = 240.0,
                paymentMethod = "Cash on Delivery (COD)",
                orderStatus = "PREPARING"
            )
        )

        fun initialAuditLogs(): List<AuditLogEntry> = listOf(
            AuditLogEntry(
                action = "SYSTEM_INITIALIZED",
                entityType = "PLATFORM",
                entityId = "bargarh_food",
                details = "Marketplace initialized for Bargarh city with 4 active restaurants"
            )
        )
    }
}
