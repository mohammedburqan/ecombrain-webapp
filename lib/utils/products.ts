import fs from 'fs'
import path from 'path'

export interface Product {
  title: string
  description: string
  price: string
  image_prompt: string
}

export interface ProductsData {
  [category: string]: Product[]
}

/**
 * Maps niche names to product category keys in the JSON file
 */
export function mapNicheToCategory(niche: string): string | null {
  const nicheLower = niche.toLowerCase().trim()
  
  // Mapping rules for common niche variations
  const mappings: Record<string, string> = {
    // Pets category
    'pet': 'pets',
    'pets': 'pets',
    'pet products': 'pets',
    'pet care': 'pets',
    'pet supplies': 'pets',
    'pet accessories': 'pets',
    'dog': 'pets',
    'cat': 'pets',
    'animal': 'pets',
    'animals': 'pets',
    
    // Kitchenware category
    'kitchen': 'kitchenware',
    'kitchenware': 'kitchenware',
    'kitchen products': 'kitchenware',
    'kitchen supplies': 'kitchenware',
    'cooking': 'kitchenware',
    'cookware': 'kitchenware',
    
    // Kids category
    'kids': 'kids',
    'kid': 'kids',
    'children': 'kids',
    'children products': 'kids',
    'toys': 'kids',
    'toy': 'kids',
    'baby': 'kids',
    'babies': 'kids',
    
    // Health & Beauty category
    'health': 'health_beauty',
    'beauty': 'health_beauty',
    'health beauty': 'health_beauty',
    'health & beauty': 'health_beauty',
    'skincare': 'health_beauty',
    'cosmetics': 'health_beauty',
    'wellness': 'health_beauty',
    
    // Fitness category
    'fitness': 'fitness',
    'exercise': 'fitness',
    'workout': 'fitness',
    'gym': 'fitness',
    'sports': 'fitness',
    'athletic': 'fitness',
  }
  
  // Direct match
  if (mappings[nicheLower]) {
    return mappings[nicheLower]
  }
  
  // Partial match - check if niche contains any key phrase
  for (const [key, category] of Object.entries(mappings)) {
    if (nicheLower.includes(key) || key.includes(nicheLower)) {
      return category
    }
  }
  
  return null
}

/**
 * Loads products from JSON file based on niche
 */
export function loadProductsFromJSON(niche: string): Product[] {
  try {
    const productsPath = path.join(process.cwd(), 'data', 'products.json')
    
    if (!fs.existsSync(productsPath)) {
      throw new Error('Products JSON file not found at /data/products.json')
    }
    
    const fileContent = fs.readFileSync(productsPath, 'utf-8')
    const productsData: ProductsData = JSON.parse(fileContent)
    
    // Map niche to category
    const category = mapNicheToCategory(niche)
    
    if (!category) {
      return []
    }
    
    // Get products for the category
    const products = productsData[category]
    
    if (!products || products.length === 0) {
      return []
    }
    
    return products
  } catch (error) {
    console.error('Error loading products from JSON:', error)
    throw new Error(`Failed to load products: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validates product structure
 */
export function validateProduct(product: any): product is Product {
  return (
    typeof product === 'object' &&
    typeof product.title === 'string' &&
    typeof product.description === 'string' &&
    typeof product.price === 'string' &&
    typeof product.image_prompt === 'string'
  )
}

