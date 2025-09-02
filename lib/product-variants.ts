export const PRESET_COLORS = [
  { name: "Red", value: "red", hex: "#ef4444", rgb: "239, 68, 68" },
  { name: "Pink", value: "pink", hex: "#ec4899", rgb: "236, 72, 153" },
  { name: "Purple", value: "purple", hex: "#a855f7", rgb: "168, 85, 247" },
  { name: "Yellow", value: "yellow", hex: "#eab308", rgb: "234, 179, 8" },
  { name: "Black", value: "black", hex: "#000000", rgb: "0, 0, 0" },
  { name: "White", value: "white", hex: "#ffffff", rgb: "255, 255, 255" },
  { name: "Blue", value: "blue", hex: "#3b82f6", rgb: "59, 130, 246" },
  { name: "Green", value: "green", hex: "#22c55e", rgb: "34, 197, 94" },
]

export const PRESET_SIZES = {
  general: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  shoes: {
    eu: ["39", "39.5", "40", "40.5", "41", "41.5", "42", "42.5", "43", "43.5", "44", "44.5", "45", "45.5", "46", "47", "48"],
    us: ["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "12.5", "13", "14", "15"],
    uk: ["5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "12.5", "13", "14"]
  },
  clothing: ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL"],
  numbers: ["0", "2", "4", "6", "8", "10", "12", "14", "16", "18", "20", "22", "24", "26", "28", "30"]
}

export interface ProductVariant {
  id: string
  color?: string
  size?: string
  price?: number
  sku?: string
  inventory?: number
  image?: string
}

export interface UploadedImage {
  file: File
  preview: string
  uploaded: boolean
  url?: string
  path?: string
}

export interface Category {
  id: string
  name: string
  description?: string
  requires_variants?: boolean
  variant_types?: string[]
}

export const generateVariantSKU = (baseProductName: string, color?: string, size?: string): string => {
  const baseSKU = baseProductName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 6)
  
  const colorCode = color ? color.toUpperCase().substring(0, 3) : ''
  const sizeCode = size ? size.toUpperCase().replace(/[^A-Z0-9]/g, '') : ''
  
  return [baseSKU, colorCode, sizeCode].filter(Boolean).join('-')
}

export const calculateVariantCombinations = (colors: string[], sizes: string[]): number => {
  if (colors.length === 0 && sizes.length === 0) return 0
  if (colors.length === 0) return sizes.length
  if (sizes.length === 0) return colors.length
  return colors.length * sizes.length
}
