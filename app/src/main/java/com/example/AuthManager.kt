package com.example

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

object AuthManager {
    // Default mode: Guest customer browsing Bargarh Food without forced login
    private val guestCustomer = User(
        uid = "guest-customer",
        name = "Guest Customer",
        email = "",
        role = "CUSTOMER",
        businessId = null
    )

    private val _currentUser = MutableStateFlow<User>(guestCustomer)
    val currentUser: StateFlow<User> = _currentUser.asStateFlow()

    fun getCurrentUser(): User {
        return _currentUser.value
    }

    fun switchToCustomer() {
        _currentUser.value = guestCustomer
    }

    fun loginAsOwner(restaurantId: String, restaurantName: String) {
        _currentUser.value = User(
            uid = "owner-$restaurantId",
            name = "$restaurantName Owner",
            email = "owner@$restaurantId.bargarh",
            role = "BUSINESS_OWNER",
            businessId = restaurantId
        )
    }

    fun loginAsAdmin() {
        _currentUser.value = User(
            uid = "admin-bargarh",
            name = "Bargarh Food Admin",
            email = "admin@bargarhfood.in",
            role = "ADMIN",
            businessId = null
        )
    }

    fun signOut() {
        _currentUser.value = guestCustomer
    }
}
