terraform {
    Uncomment this to get it running in the CD pipeline.
    backend "azurerm" {
        resource_group_name  = "flixtubex9-terraform"
        storage_account_name = "flixtubex9terraform"
        container_name       = "terraform"
        key                  = "terraform.tfstate"
    }
}