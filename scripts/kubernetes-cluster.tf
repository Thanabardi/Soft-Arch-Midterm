# Creates a managed Kubernetes cluster on Azure.

resource "azurerm_kubernetes_cluster" "cluster" {
    name                = var.app_name
    location            = var.location
    resource_group_name = azurerm_resource_group.flixtubex9.name
    dns_prefix          = var.app_name
    kubernetes_version  = "1.25.4"

    linux_profile {
        admin_username = var.admin_username

        ssh_key {
            key_data = "${trimspace(tls_private_key.key.public_key_openssh)} ${var.admin_username}@azure.com"
        }
    }

    default_node_pool {
        name            = "default"
        node_count      = 1
        vm_size         = "Standard_B2ms"
    }

    service_principal {
        client_id     = "7bd4b568-8068-4e0b-849c-8b3b580b9cf7"
        client_secret = "PPf8Q~UIkHQBpHstiFPUzHjxZehtdMegbra8zbGE"
    }
}

output "cluster_client_key" {
  value = azurerm_kubernetes_cluster.cluster.kube_config[0].client_key
  sensitive = true
}

output "cluster_client_certificate" {
  value = azurerm_kubernetes_cluster.cluster.kube_config[0].client_certificate
  sensitive = true
}

output "cluster_cluster_ca_certificate" {
  value = azurerm_kubernetes_cluster.cluster.kube_config[0].cluster_ca_certificate
  sensitive = true
}

output "cluster_cluster_username" {
  value = azurerm_kubernetes_cluster.cluster.kube_config[0].username
  sensitive = true
}

output "cluster_cluster_password" {
  value = azurerm_kubernetes_cluster.cluster.kube_config[0].password
  sensitive = true
}

output "cluster_kube_config" {
  value = azurerm_kubernetes_cluster.cluster.kube_config_raw
  sensitive = true
}

output "cluster_host" {
  value = azurerm_kubernetes_cluster.cluster.kube_config[0].host
  sensitive = true
}

