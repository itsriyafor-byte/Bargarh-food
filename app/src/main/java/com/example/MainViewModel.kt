package com.example

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class MainViewModel : ViewModel() {
    val repository = BargarhFoodRepository()

    private val _currentUser = MutableStateFlow<User>(AuthManager.getCurrentUser())
    val currentUser: StateFlow<User> = _currentUser.asStateFlow()

    // Cart state for Customer
    private val _cartItems = MutableStateFlow<List<OrderItem>>(emptyList())
    val cartItems: StateFlow<List<OrderItem>> = _cartItems.asStateFlow()

    private val _cartBusiness = MutableStateFlow<Business?>(null)
    val cartBusiness: StateFlow<Business?> = _cartBusiness.asStateFlow()

    fun switchRoleToCustomer() {
        AuthManager.switchToCustomer()
        _currentUser.value = AuthManager.getCurrentUser()
    }

    fun switchRoleToOwner(restaurantId: String, restaurantName: String) {
        AuthManager.loginAsOwner(restaurantId, restaurantName)
        _currentUser.value = AuthManager.getCurrentUser()
    }

    fun switchRoleToAdmin() {
        AuthManager.loginAsAdmin()
        _currentUser.value = AuthManager.getCurrentUser()
    }

    fun signOut() {
        AuthManager.signOut()
        _currentUser.value = AuthManager.getCurrentUser()
    }

    // Cart Management
    fun addToCart(product: Product, business: Business) {
        if (_cartBusiness.value != null && _cartBusiness.value?.businessId != business.businessId) {
            // Reset cart if adding from another restaurant
            _cartItems.value = listOf(
                OrderItem(
                    productId = product.productId,
                    productName = product.name,
                    priceAtPurchase = product.price,
                    quantity = 1,
                    subtotal = product.price
                )
            )
            _cartBusiness.value = business
            return
        }

        _cartBusiness.value = business
        val currentList = _cartItems.value.toMutableList()
        val index = currentList.indexOfFirst { it.productId == product.productId }
        if (index >= 0) {
            val existing = currentList[index]
            val newQty = existing.quantity + 1
            currentList[index] = existing.copy(
                quantity = newQty,
                subtotal = existing.priceAtPurchase * newQty
            )
        } else {
            currentList.add(
                OrderItem(
                    productId = product.productId,
                    productName = product.name,
                    priceAtPurchase = product.price,
                    quantity = 1,
                    subtotal = product.price
                )
            )
        }
        _cartItems.value = currentList
    }

    fun updateCartQuantity(productId: String, delta: Int) {
        val currentList = _cartItems.value.toMutableList()
        val index = currentList.indexOfFirst { it.productId == productId }
        if (index >= 0) {
            val existing = currentList[index]
            val newQty = existing.quantity + delta
            if (newQty <= 0) {
                currentList.removeAt(index)
            } else {
                currentList[index] = existing.copy(
                    quantity = newQty,
                    subtotal = existing.priceAtPurchase * newQty
                )
            }
            _cartItems.value = currentList
            if (currentList.isEmpty()) {
                _cartBusiness.value = null
            }
        }
    }

    fun clearCart() {
        _cartItems.value = emptyList()
        _cartBusiness.value = null
    }
}
