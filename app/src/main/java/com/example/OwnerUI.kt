package com.example

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OwnerApp(user: User, viewModel: MainViewModel, onSwitchRole: () -> Unit) {
    val repo = viewModel.repository
    val scope = rememberCoroutineScope()
    val allBusinesses by repo.businesses.collectAsState()

    var selectedBusinessId by remember {
        mutableStateOf(user.businessId ?: allBusinesses.firstOrNull()?.businessId ?: "")
    }

    LaunchedEffect(allBusinesses) {
        if (selectedBusinessId.isEmpty() && allBusinesses.isNotEmpty()) {
            selectedBusinessId = user.businessId ?: allBusinesses.first().businessId
        }
    }

    val currentBusiness = allBusinesses.find { it.businessId == selectedBusinessId }

    val allOrders by repo.orders.collectAsState()
    val allProducts by repo.products.collectAsState()

    // STRICT ISOLATION: Owner only sees products and orders belonging to their assigned restaurant!
    val restaurantOrders = allOrders.filter { it.businessId == selectedBusinessId }
    val restaurantProducts = allProducts.filter { it.businessId == selectedBusinessId }

    val activeOrders = restaurantOrders.filter { it.orderStatus != "DELIVERED" && it.orderStatus != "REJECTED" && it.orderStatus != "CANCELLED" }
    val deliveredOrders = restaurantOrders.filter { it.orderStatus == "DELIVERED" }
    val deliveredRevenue = deliveredOrders.sumOf { it.subtotal }

    var selectedTab by remember { mutableStateOf(0) } // 0: Orders, 1: Menu, 2: History
    var showAddProductDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Restaurant Portal",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = currentBusiness?.name ?: "Owner Portal",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                },
                actions = {
                    TextButton(onClick = onSwitchRole) {
                        Text("Switch Role", fontWeight = FontWeight.Bold)
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Restaurant Switcher (For demo/testing multi-restaurant isolation)
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text(
                            text = "Active Restaurant Isolation:",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.outline
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            allBusinesses.forEach { b ->
                                FilterChip(
                                    selected = selectedBusinessId == b.businessId,
                                    onClick = { selectedBusinessId = b.businessId },
                                    label = { Text(b.name, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                                    shape = RoundedCornerShape(12.dp)
                                )
                            }
                        }
                    }
                }
            }

            // Metrics Summary Row
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Card(
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
                    ) {
                        Column(modifier = Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("Active Orders", style = MaterialTheme.typography.labelSmall)
                            Text(
                                "${activeOrders.size}",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.ExtraBold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                    Card(
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                    ) {
                        Column(modifier = Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("Delivered", style = MaterialTheme.typography.labelSmall)
                            Text(
                                "${deliveredOrders.size}",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.ExtraBold
                            )
                        }
                    }
                    Card(
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                    ) {
                        Column(modifier = Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("Sales", style = MaterialTheme.typography.labelSmall)
                            Text(
                                "₹${deliveredRevenue.toInt()}",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.ExtraBold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }
            }

            // Tabs Selector
            item {
                TabRow(selectedTabIndex = selectedTab) {
                    Tab(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        text = { Text("Orders (${activeOrders.size})") }
                    )
                    Tab(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        text = { Text("Menu (${restaurantProducts.size})") }
                    )
                    Tab(
                        selected = selectedTab == 2,
                        onClick = { selectedTab = 2 },
                        text = { Text("History (${deliveredOrders.size})") }
                    )
                }
            }

            // Tab 0: Active Orders & Status Progression
            if (selectedTab == 0) {
                if (activeOrders.isEmpty()) {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(20.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Box(modifier = Modifier.padding(32.dp).fillMaxWidth(), contentAlignment = Alignment.Center) {
                                Text("No incoming active orders right now.")
                            }
                        }
                    }
                } else {
                    items(activeOrders) { order ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(20.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = order.orderId,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    Surface(
                                        shape = RoundedCornerShape(12.dp),
                                        color = MaterialTheme.colorScheme.primaryContainer
                                    ) {
                                        Text(
                                            text = order.orderStatus,
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Customer: ${order.customerName} (${order.customerPhone})",
                                    style = MaterialTheme.typography.bodySmall,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = "Address: ${order.deliveryAddress}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.outline
                                )
                                if (order.notes.isNotEmpty()) {
                                    Text(
                                        text = "Instructions: \"${order.notes}\"",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }

                                Divider(modifier = Modifier.padding(vertical = 8.dp))

                                // Items summary
                                order.items.forEach { item ->
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text("${item.productName} × ${item.quantity}", style = MaterialTheme.typography.bodySmall)
                                        Text("₹${item.subtotal.toInt()}", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold)
                                    }
                                }

                                Spacer(modifier = Modifier.height(6.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text("COD Total to Collect:", fontWeight = FontWeight.Bold)
                                    Text("₹${order.total.toInt()}", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                                }

                                Spacer(modifier = Modifier.height(10.dp))

                                // Status action buttons
                                when (order.orderStatus) {
                                    "NEW" -> {
                                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                            Button(
                                                onClick = {
                                                    scope.launch {
                                                        repo.updateOrderStatus(order.orderId, "ACCEPTED")
                                                        repo.recordAudit("ACCEPT_ORDER", "ORDER", order.orderId, "Owner accepted order")
                                                    }
                                                },
                                                modifier = Modifier.weight(1f),
                                                shape = RoundedCornerShape(12.dp)
                                            ) {
                                                Text("✓ Accept Order")
                                            }
                                            OutlinedButton(
                                                onClick = {
                                                    scope.launch {
                                                        repo.updateOrderStatus(order.orderId, "REJECTED")
                                                        repo.recordAudit("REJECT_ORDER", "ORDER", order.orderId, "Owner rejected order")
                                                    }
                                                },
                                                shape = RoundedCornerShape(12.dp)
                                            ) {
                                                Text("Reject")
                                            }
                                        }
                                    }
                                    "ACCEPTED" -> {
                                        Button(
                                            onClick = {
                                                scope.launch {
                                                    repo.updateOrderStatus(order.orderId, "PREPARING")
                                                }
                                            },
                                            modifier = Modifier.fillMaxWidth(),
                                            shape = RoundedCornerShape(12.dp)
                                        ) {
                                            Text("🔥 Start Cooking & Preparing")
                                        }
                                    }
                                    "PREPARING" -> {
                                        Button(
                                            onClick = {
                                                scope.launch {
                                                    repo.updateOrderStatus(order.orderId, "READY")
                                                }
                                            },
                                            modifier = Modifier.fillMaxWidth(),
                                            shape = RoundedCornerShape(12.dp)
                                        ) {
                                            Text("🥡 Food Packed & Ready")
                                        }
                                    }
                                    "READY" -> {
                                        Button(
                                            onClick = {
                                                scope.launch {
                                                    repo.updateOrderStatus(order.orderId, "OUT_FOR_DELIVERY")
                                                }
                                            },
                                            modifier = Modifier.fillMaxWidth(),
                                            shape = RoundedCornerShape(12.dp)
                                        ) {
                                            Text("🛵 Dispatch Out for Delivery")
                                        }
                                    }
                                    "OUT_FOR_DELIVERY" -> {
                                        Button(
                                            onClick = {
                                                scope.launch {
                                                    repo.updateOrderStatus(order.orderId, "DELIVERED")
                                                    repo.recordAudit("ORDER_DELIVERED", "ORDER", order.orderId, "Delivered and cash collected")
                                                }
                                            },
                                            modifier = Modifier.fillMaxWidth(),
                                            shape = RoundedCornerShape(12.dp)
                                        ) {
                                            Text("✅ Delivered (Cash ₹${order.total.toInt()} Collected)")
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Tab 1: Menu Management (Add, Edit Price, Availability)
            if (selectedTab == 1) {
                item {
                    Button(
                        onClick = { showAddProductDialog = true },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Add")
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Add New Food Item")
                    }
                }

                items(restaurantProducts) { product ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(if (product.isVeg) "🟢" else "🔴")
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(product.name, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
                                }
                                Text("Price: ₹${product.price.toInt()}", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                                Text("Category: ${product.categoryId}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.outline)
                            }

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                FilterChip(
                                    selected = product.availability,
                                    onClick = {
                                        scope.launch {
                                            repo.updateProduct(product.copy(availability = !product.availability))
                                        }
                                    },
                                    label = { Text(if (product.availability) "In Stock" else "Sold Out") },
                                    shape = RoundedCornerShape(12.dp)
                                )
                                IconButton(
                                    onClick = {
                                        scope.launch {
                                            repo.deleteProduct(product.productId)
                                        }
                                    }
                                ) {
                                    Icon(Icons.Default.Delete, contentDescription = "Delete", tint = MaterialTheme.colorScheme.error)
                                }
                            }
                        }
                    }
                }
            }

            // Tab 2: Order History
            if (selectedTab == 2) {
                if (deliveredOrders.isEmpty()) {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(20.dp)
                        ) {
                            Box(modifier = Modifier.padding(32.dp).fillMaxWidth(), contentAlignment = Alignment.Center) {
                                Text("No completed orders yet.")
                            }
                        }
                    }
                } else {
                    items(deliveredOrders) { order ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp).fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(order.orderId, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                                    Text("Customer: ${order.customerName}", style = MaterialTheme.typography.bodySmall)
                                    Text("${order.items.size} items", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.outline)
                                }
                                Text("₹${order.total.toInt()} (Delivered)", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(30.dp)) }
        }
    }

    // Dialog: Add Food Item
    if (showAddProductDialog) {
        var name by remember { mutableStateOf("") }
        var desc by remember { mutableStateOf("") }
        var priceStr by remember { mutableStateOf("") }
        var category by remember { mutableStateOf("Biryani") }
        var isVeg by remember { mutableStateOf(true) }
        var imageUrl by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { showAddProductDialog = false },
            title = { Text("Add Menu Item") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Item Name *") },
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = desc,
                        onValueChange = { desc = it },
                        label = { Text("Description") }
                    )
                    OutlinedTextField(
                        value = priceStr,
                        onValueChange = { priceStr = it },
                        label = { Text("Price (₹) *") },
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = category,
                        onValueChange = { category = it },
                        label = { Text("Category (Biryani, Tiffin, Momo, etc.)") },
                        singleLine = true
                    )
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = isVeg, onCheckedChange = { isVeg = it })
                        Text(if (isVeg) "Pure Veg (🟢)" else "Non-Veg (🔴)")
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val price = priceStr.toDoubleOrNull() ?: 0.0
                        if (name.isNotBlank() && price > 0) {
                            scope.launch {
                                repo.addProduct(
                                    Product(
                                        businessId = selectedBusinessId,
                                        categoryId = category.trim(),
                                        name = name.trim(),
                                        description = desc.trim(),
                                        price = price,
                                        imageUrl = imageUrl.trim(),
                                        availability = true,
                                        isVeg = isVeg
                                    )
                                )
                                showAddProductDialog = false
                            }
                        }
                    }
                ) {
                    Text("Add Item")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddProductDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}
