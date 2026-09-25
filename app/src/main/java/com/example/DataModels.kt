package com.example

import java.util.UUID

data class User(
    val uid: String = UUID.randomUUID().toString(),
    val name: String = "",
    val email: String = "",
    val role: String = "CUSTOMER", // CUSTOMER, BUSINESS_OWNER, ADMIN
    val businessId: String? = null // For owners: assigned restaurant ID
)

data class Business(
    val businessId: String = UUID.randomUUID().toString(),
    val name: String = "",
    val description: String = "",
    val category: String = "",
    val phone: String = "",
    val address: String = "",
    val cityId: String = "bargarh_city",
    val logoUrl: String = "",
    val coverImageUrl: String = "",
    val openingHours: String = "10:00 AM - 10:30 PM",
    val deliveryAvailable: Boolean = true,
    val pickupAvailable: Boolean = true,
    val deliveryFee: Double = 30.0,
    val minOrderAmount: Double = 100.0,
    val commissionPercentage: Double = 10.0,
    val status: String = "APPROVED", // APPROVED, INACTIVE
    val isFeatured: Boolean = false,
    val ownerId: String = "",
    val createdAt: Long = System.currentTimeMillis()
)

data class Product(
    val productId: String = UUID.randomUUID().toString(),
    val businessId: String = "",
    val categoryId: String = "",
    val name: String = "",
    val description: String = "",
    val price: Double = 0.0,
    val imageUrl: String = "",
    val availability: Boolean = true,
    val isVeg: Boolean = true
)

data class OrderItem(
    val productId: String = "",
    val productName: String = "",
    val priceAtPurchase: Double = 0.0, // Frozen price snapshot at purchase time
    val quantity: Int = 1,
    val subtotal: Double = 0.0
)

data class Order(
    val orderId: String = "BF-" + (10000 + (Math.random() * 90000).toInt()),
    val customerName: String = "",
    val customerPhone: String = "",
    val businessId: String = "",
    val businessName: String = "",
    val cityId: String = "bargarh_city",
    val items: List<OrderItem> = emptyList(),
    val subtotal: Double = 0.0,
    val deliveryFee: Double = 0.0,
    val total: Double = 0.0,
    val paymentMethod: String = "Cash on Delivery (COD)", // COD only for V1
    val orderStatus: String = "NEW", // NEW, ACCEPTED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED, REJECTED, CANCELLED
    val deliveryAddress: String = "",
    val notes: String = "",
    val createdAt: Long = System.currentTimeMillis()
)

data class AuditLogEntry(
    val id: String = UUID.randomUUID().toString(),
    val action: String = "",
    val entityType: String = "",
    val entityId: String = "",
    val details: String = "",
    val timestamp: Long = System.currentTimeMillis()
)
