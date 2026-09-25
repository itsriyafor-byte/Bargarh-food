package com.example

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppNavigation(viewModel: MainViewModel) {
    val currentUser by viewModel.currentUser.collectAsState()
    var showRoleSwitchDialog by remember { mutableStateOf(false) }

    when (currentUser.role) {
        "CUSTOMER" -> {
            CustomerApp(
                user = currentUser,
                viewModel = viewModel,
                onSwitchRole = { showRoleSwitchDialog = true }
            )
        }
        "BUSINESS_OWNER" -> {
            OwnerApp(
                user = currentUser,
                viewModel = viewModel,
                onSwitchRole = { showRoleSwitchDialog = true }
            )
        }
        "ADMIN" -> {
            AdminApp(
                user = currentUser,
                viewModel = viewModel,
                onSwitchRole = { showRoleSwitchDialog = true }
            )
        }
    }

    if (showRoleSwitchDialog) {
        AlertDialog(
            onDismissRequest = { showRoleSwitchDialog = false },
            title = {
                Text(
                    text = "Bargarh Food Portals",
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "Switch between customer storefront and management portals:",
                        style = MaterialTheme.typography.bodyMedium
                    )

                    OutlinedButton(
                        onClick = {
                            viewModel.switchRoleToCustomer()
                            showRoleSwitchDialog = false
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Text("🍽️ Customer Storefront (Guest Browsing)")
                    }

                    OutlinedButton(
                        onClick = {
                            viewModel.switchRoleToOwner(
                                "rest-bargarh-biryani",
                                "Bargarh Biryani Mahal"
                            )
                            showRoleSwitchDialog = false
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Text("👨‍🍳 Restaurant Owner Portal")
                    }

                    OutlinedButton(
                        onClick = {
                            viewModel.switchRoleToAdmin()
                            showRoleSwitchDialog = false
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Text("🛡️ Platform Admin Dashboard")
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showRoleSwitchDialog = false }) {
                    Text("Close")
                }
            }
        )
    }
}
