<template>
  <div class="products">
    <div class="products-content">
      <div class="products-section">
        <div class="products-header-controls">
          <h3>Product Management</h3>

          <!-- Status Filter Buttons -->
          <div class="status-filters">
            <button @click="changeStatus('live')" :class="['filter-btn', { active: currentStatus === 'live' }]">Live ({{ productCounts.live_count }})</button>
            <button @click="changeStatus('out_of_stock')" :class="['filter-btn', { active: currentStatus === 'out_of_stock' }]">
              Out of Stock ({{ productCounts.out_of_stock_count }})
            </button>
            <button @click="showAddProduct" :class="['filter-btn add-btn', { active: currentStatus === 'add' }]">Add Product</button>
          </div>
        </div>

        <!-- Product Summary -->
        <div class="product-summary">
          <p>Total Products: {{ productCounts.total_products }} | Showing: {{ getStatusLabel() }} ({{ products.length }})</p>
        </div>

        <div v-if="loading" class="loading-message">Loading products...</div>

        <div v-else-if="error" class="error-message">{{ error }}</div>

        <!-- Add Product Form -->
        <div v-if="currentStatus === 'add'" class="add-product-form">
          <div class="form-card">
            <h3>{{ isEditing ? "Edit Product" : "Add New Product" }}</h3>
            <form @submit.prevent="isEditing ? updateProduct() : addProduct()">
              <div class="form-row">
                <div class="form-group">
                  <label for="productId">Product ID</label>
                  <input
                    v-model.number="newProduct.id"
                    type="number"
                    id="productId"
                    :required="!isEditing"
                    :disabled="isEditing"
                    class="form-input"
                    :placeholder="isEditing ? 'ID cannot be changed' : 'Enter unique product ID'" />
                </div>
                <div class="form-group">
                  <label for="title">Product Title</label>
                  <input v-model="newProduct.title" type="text" id="title" required class="form-input" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="price">Price (£)</label>
                  <input v-model.number="newProduct.price" type="number" id="price" required class="form-input" />
                </div>
                <div class="form-group">
                  <label for="quantity">Quantity</label>
                  <input v-model.number="newProduct.quantity" type="number" id="quantity" min="1" required class="form-input" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="modelSize">Model Size Info Available?</label>
                  <input type="checkbox" v-model="newProduct.modelSize" id="modelSize" class="checkbox-input" />
                </div>
                <div class="form-group">
                  <!-- Spacer for layout -->
                </div>
              </div>

              <div class="form-group">
                <label for="description">Description</label>
                <textarea v-model="newProduct.description" id="description" required class="form-textarea"></textarea>
              </div>

              <div class="form-group">
                <label>Description Points</label>
                <div v-for="(point, index) in newProduct.descPoints" :key="index" class="desc-point">
                  <input v-model="newProduct.descPoints[index]" type="text" class="form-input" />
                  <button type="button" @click="removeDescPoint(index)" class="remove-btn">×</button>
                </div>
                <button type="button" @click="addDescPoint" class="add-point-btn">Add Point</button>
              </div>

              <div class="form-group">
                <label>Product Images (Max 10)</label>
                <div class="image-upload-section">
                  <input
                    type="file"
                    @change="handleMultipleImageUpload"
                    accept="image/*,.heic,.heif"
                    multiple
                    class="file-input"
                    :disabled="uploadingImage || getAllImages().length >= 10" />
                  <span v-if="uploadingImage" class="upload-status">Processing & uploading...</span>
                  <span class="file-format-info"> Supports: JPG, PNG, WEBP, HEIC | {{ getAllImages().length }}/10 images </span>
                </div>

                <!-- Show all image previews -->
                <div v-if="getAllImages().length > 0" class="images-grid">
                  <div v-for="(image, index) in getAllImages()" :key="index" class="image-preview-item">
                    <img :src="processImageData(image)" :alt="`Product image ${index + 1}`" class="preview-img" />
                    <div class="image-controls">
                      <button type="button" @click="setMainImage(index)" :class="['main-btn', { active: index === 0 }]" :disabled="index === 0">
                        {{ index === 0 ? "Main" : "Set Main" }}
                      </button>
                      <button type="button" @click="removeImageByIndex(index)" class="remove-img-btn">×</button>
                    </div>
                  </div>
                </div>

                <!-- Manual URL input as fallback -->
                <div class="manual-url-section" v-if="getAllImages().length < 10">
                  <label for="manualImageUrl">Or add image URL manually:</label>
                  <div class="manual-url-input">
                    <input v-model="manualImageUrl" type="text" id="manualImageUrl" class="form-input" placeholder="https://example.com/image.jpg" />
                    <button type="button" @click="addManualImage" class="add-url-btn" :disabled="!manualImageUrl.trim()">Add</button>
                  </div>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="postable">Postable?</label>
                  <input type="checkbox" v-model="newProduct.postable" id="postable" class="checkbox-input" />
                </div>
                <div class="form-group">
                  <!-- Spacer for layout -->
                </div>
              </div>

              <div class="form-group" v-if="newProduct.modelSize">
                <label>Model Details</label>
                <div v-for="(detail, index) in newProduct.modelDetails" :key="index" class="desc-point">
                  <input v-model="newProduct.modelDetails[index]" type="text" placeholder="e.g., Alfie is 6' wearing M" class="form-input" />
                  <button type="button" @click="removeModelDetail(index)" class="remove-btn">×</button>
                </div>
                <button type="button" @click="addModelDetail" class="add-point-btn">Add Model Detail</button>
              </div>

              <div class="form-group">
                <label>Available Sizes</label>
                <div class="size-checkboxes">
                  <label v-for="size in availableSizes" :key="size" class="size-checkbox">
                    <input type="checkbox" :value="size" v-model="newProduct.sizes" />
                    {{ size }}
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label>Stock Levels</label>
                <div class="stock-inputs">
                  <div v-for="size in newProduct.sizes" :key="size" class="stock-input">
                    <label>{{ size }}:</label>
                    <input v-model.number="newProduct.stockLevel[size.toLowerCase()]" type="number" min="0" class="stock-field" />
                  </div>
                </div>
              </div>

              <div class="form-actions">
                <button type="submit" class="submit-btn" :disabled="addingProduct">
                  {{ addingProduct ? (isEditing ? "Updating..." : "Adding...") : isEditing ? "Update Product" : "Add Product" }}
                </button>
                <button type="button" @click="resetForm" class="cancel-btn">
                  {{ isEditing ? "Cancel Edit" : "Reset" }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div v-else-if="products.length === 0" class="no-products">No {{ getStatusLabel().toLowerCase() }} products found.</div>

        <!-- Products Grid -->
        <div v-else class="products-grid">
          <div v-for="product in products" :key="product._id?.$oid || product._id" class="product-card">
            <!-- Product Header -->
            <div class="product-header">
              <div class="product-info">
                <h4>{{ product.title }}</h4>
                <p class="product-id">ID: {{ product.id }}</p>
              </div>
              <div class="product-price">
                <span class="price-amount">£{{ product.price }}</span>
              </div>
            </div>

            <!-- Product Image -->
            <div class="product-image" v-if="product.image1">
              <img :src="processImageData(product.image1)" :alt="product.title" @error="handleImageError" />
            </div>

            <!-- Product Description -->
            <div class="product-description">
              <p>{{ product.description }}</p>
              <div v-if="product.descPoints && product.descPoints.length > 0" class="desc-points">
                <h5>Details</h5>
                <ul>
                  <li v-for="(point, index) in product.descPoints" :key="index">{{ point }}</li>
                </ul>
              </div>
            </div>

            <!-- Quantity -->
            <div class="product-quantity" v-if="product.quantity">
              <h5>
                Quantity: <span>{{ product.quantity }}</span>
              </h5>
            </div>

            <!-- Model Details -->
            <div class="model-details" v-if="product.modelSize && product.modelDetails && product.modelDetails.length > 0">
              <h5>Model Info</h5>
              <ul class="model-list">
                <li v-for="(detail, index) in product.modelDetails" :key="index">{{ detail }}</li>
              </ul>
            </div>

            <!-- Available Sizes -->
            <div class="product-sizes">
              <h5>Available Sizes</h5>
              <div class="sizes-list">
                <span v-for="size in product.sizes" :key="size" class="size-badge">
                  {{ size }}
                </span>
              </div>
            </div>

            <!-- Stock Levels -->
            <div class="stock-levels">
              <h5>Stock Levels</h5>
              <div class="stock-grid">
                <div v-for="(quantity, size) in product.stockLevel" :key="size" class="stock-item">
                  <span class="size-label">{{ size.toUpperCase() }}:</span>
                  <span :class="['stock-quantity', { 'low-stock': quantity <= 5, 'out-of-stock': quantity === 0 }]">
                    {{ quantity }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Product Status -->
            <div class="product-status-display">
              <span :class="['status-badge', getProductStatusClass(product)]">
                {{ getProductStatusLabel(product) }}
              </span>
            </div>

            <!-- Postable Status -->
            <div class="postable-status" v-if="product.postable !== undefined">
              <span :class="['postable-badge', { postable: product.postable, 'not-postable': !product.postable }]">
                {{ product.postable ? "Postable ✓" : "Not Postable" }}
              </span>
            </div>

            <!-- New Product Badge -->
            <div class="new-product-badge" v-if="product.new">
              <span class="new-badge">New!</span>
            </div>

            <!-- Action Buttons -->
            <div class="product-actions">
              <div class="auto-status-info">
                <span class="status-info-text"> Status: {{ isProductLive(product) ? "Live (Has Stock)" : "Out of Stock" }} </span>
              </div>

              <button @click="editProduct(product)" class="edit-btn">Edit Product</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "ProductsView",
  data() {
    return {
      apiUrl: process.env.VUE_APP_API_URL || "http://localhost:4242",
      products: [],
      loading: false,
      error: null,
      addingProduct: false,
      isEditing: false,
      editingProduct: null,
      currentStatus: "live",
      uploadingImage: false,
      manualImageUrl: "",
      productCounts: {
        total_products: 0,
        live_count: 0,
        out_of_stock_count: 0,
      },
      availableSizes: ["XS", "S", "M", "L", "XL"],
      newProduct: {
        id: null,
        title: "",
        description: "",
        descPoints: [""],
        price: 0,
        quantity: 1,
        image1: "",
        images: [],
        sizes: [],
        stockLevel: {},
        postable: true,
        new: true,
        modelSize: false,
        modelDetails: [],
      },
    };
  },
  mounted() {
    // Check if we have a valid token before making requests
    if (!this.isTokenValid()) {
      console.error("No valid token found, redirecting to login");
      this.clearTokenData();
      this.$router.push("/login");
      return;
    }

    // Set axios default header with fresh token
    const tokenData = JSON.parse(localStorage.getItem("tokenData"));
    axios.defaults.headers.common["Authorization"] = `Bearer ${tokenData.token}`;

    this.fetchProducts("live");
  },
  methods: {
    async fetchProducts(filterStatus = null) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get(`${this.apiUrl}/api/get/products/database`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const allProducts = response.data.products || response.data || [];

        // Calculate counts based on stock levels
        const liveProducts = allProducts.filter((product) => this.getTotalStock(product) > 0);
        const outOfStockProducts = allProducts.filter((product) => this.getTotalStock(product) === 0);

        this.productCounts = {
          total_products: allProducts.length,
          live_count: liveProducts.length,
          out_of_stock_count: outOfStockProducts.length,
        };

        // Filter products based on current status
        if (filterStatus === "live") {
          this.products = liveProducts;
        } else if (filterStatus === "out_of_stock") {
          this.products = outOfStockProducts;
        } else {
          this.products = allProducts;
        }

        if (filterStatus) {
          this.currentStatus = filterStatus;
        }
      } catch (error) {
        console.error("Error fetching products:", error);

        // Handle 401 Unauthorized - redirect to login
        if (error.response?.status === 401) {
          console.error("Token expired or invalid, redirecting to login");
          this.clearTokenData();
          this.$router.push("/login");
          return;
        }

        this.error = "Failed to load products";
        this.products = [];
      } finally {
        this.loading = false;
      }
    },

    async addProduct() {
      this.addingProduct = true;
      try {
        const response = await axios.post(`${this.apiUrl}/api/protected/products`, this.newProduct, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        // Refresh products and switch to live view
        await this.fetchProducts("live");
        this.resetForm();
        this.currentStatus = "live";
      } catch (error) {
        console.error("Error adding product:", error);

        if (error.response?.status === 401) {
          this.clearTokenData();
          this.$router.push("/login");
          return;
        }

        this.error = "Failed to add product";
      } finally {
        this.addingProduct = false;
      }
    },

    async updateProduct() {
      this.addingProduct = true;
      try {
        const productId = this.editingProduct.id;
        const response = await axios.put(`${this.apiUrl}/api/protected/products/${productId}`, this.newProduct, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        // Refresh products and return to previous view
        await this.fetchProducts(this.currentStatus === "add" ? "live" : this.currentStatus);
        this.resetForm();
        this.currentStatus = "live";
      } catch (error) {
        console.error("Error updating product:", error);

        if (error.response?.status === 401) {
          this.clearTokenData();
          this.$router.push("/login");
          return;
        }

        this.error = "Failed to update product";
      } finally {
        this.addingProduct = false;
      }
    },

    changeStatus(status) {
      if (status === "add") {
        this.showAddProduct();
      } else {
        this.fetchProducts(status);
      }
    },

    showAddProduct() {
      this.currentStatus = "add";
      this.products = [];
    },

    resetForm() {
      this.newProduct = {
        id: null,
        title: "",
        description: "",
        descPoints: [""],
        price: 0,
        quantity: 1,
        image1: "",
        images: [],
        sizes: [],
        stockLevel: {},
        postable: true,
        new: true,
        modelSize: false,
        modelDetails: [],
      };
      this.isEditing = false;
      this.editingProduct = null;
      this.uploadingImage = false;
      this.manualImageUrl = "";
    },

    addDescPoint() {
      this.newProduct.descPoints.push("");
    },

    removeDescPoint(index) {
      this.newProduct.descPoints.splice(index, 1);
    },

    addModelDetail() {
      this.newProduct.modelDetails.push("");
    },

    removeModelDetail(index) {
      this.newProduct.modelDetails.splice(index, 1);
    },

    getAllImages() {
      // Return all images from the images array (main image should be included there)
      return this.newProduct.images && Array.isArray(this.newProduct.images) ? this.newProduct.images : [];
    },

    setMainImage(index) {
      if (index === 0) return; // Already main image

      const allImages = this.getAllImages();
      if (index >= allImages.length) return;

      // Set the selected image as main
      this.newProduct.image1 = allImages[index];

      // Move the selected image to the front of the array
      const newImagesArray = [...allImages];
      const [selectedImage] = newImagesArray.splice(index, 1);
      newImagesArray.unshift(selectedImage);
      this.newProduct.images = newImagesArray;
    },
    removeImageByIndex(index) {
      const allImages = this.getAllImages();

      if (index >= allImages.length) return;

      // Remove from images array
      this.newProduct.images.splice(index, 1);

      // If removing the main image (first in array), set new main
      if (index === 0) {
        if (this.newProduct.images.length > 0) {
          // Set the new first image as main
          this.newProduct.image1 = this.newProduct.images[0];
        } else {
          // No more images
          this.newProduct.image1 = "";
        }
      }
    },

    addManualImage() {
      if (!this.manualImageUrl.trim()) return;

      if (this.getAllImages().length >= 10) {
        this.error = "Maximum 10 images allowed.";
        return;
      }

      const imageUrl = this.manualImageUrl.trim();

      // Add to images array
      this.newProduct.images.push(imageUrl);

      // If this is the first image, set as main
      if (this.newProduct.images.length === 1) {
        this.newProduct.image1 = imageUrl;
      }

      this.manualImageUrl = "";
    },

    async handleMultipleImageUpload(event) {
      const files = Array.from(event.target.files);
      if (!files.length) return;

      // Check if adding these files would exceed the limit
      const currentCount = this.getAllImages().length;
      const newCount = currentCount + files.length;
      if (newCount > 10) {
        this.error = `Cannot upload ${files.length} images. Maximum 10 images allowed (currently have ${currentCount}).`;
        return;
      }

      this.uploadingImage = true;

      try {
        const uploadPromises = files.map(async (file, index) => {
          // Log original file size
          console.log(`Processing file ${index + 1}/${files.length}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

          let fileToUpload = file;

          // Process HEIC files
          if (this.isHeicFile(file)) {
            console.log(`HEIC file detected, converting to JPG...`);
            fileToUpload = await this.convertHeicToJpg(file);
          }
          // Compress large files
          else if (!this.validateFileSize(file, 5)) {
            console.log(`Compressing large file: ${file.name}`);
            fileToUpload = await this.compressImage(file, 1200, 1200, 0.7);
          }
          // Optimize medium files
          else if (file.size > 1024 * 1024) {
            console.log(`Compressing for optimization: ${file.name}`);
            fileToUpload = await this.compressImage(file, 1200, 1200, 0.8);
          }

          // Final size check
          if (!this.validateFileSize(fileToUpload, 10)) {
            throw new Error(`File ${fileToUpload.name} is still too large after processing`);
          }

          return await this.uploadSingleFile(fileToUpload);
        });

        const uploadedImages = await Promise.all(uploadPromises);

        // Add all uploaded images to images array
        uploadedImages.forEach((imageData) => {
          this.newProduct.images.push(imageData);
        });

        // If this was the first upload, set the first image as main
        if (currentCount === 0 && uploadedImages.length > 0) {
          this.newProduct.image1 = uploadedImages[0];
        }

        // Clear the file input
        event.target.value = "";
      } catch (error) {
        console.error("Upload error:", error.response?.data);
        this.error = error.message || "Failed to upload images";
      } finally {
        this.uploadingImage = false;
      }
    },

    async handleImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      this.uploadingImage = true;

      try {
        let fileToUpload = file;

        // Check if the file is HEIC and convert to JPG
        if (file.type === "image/heic" || file.type === "image/heif" || file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif")) {
          console.log("HEIC file detected, converting to JPG...");
          fileToUpload = await this.convertHeicToJpg(file);
        }

        const formData = new FormData();
        formData.append("file", fileToUpload);

        const response = await axios.post(`${this.apiUrl}/api/upload`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        this.newProduct.image1 = response.data;
      } catch (error) {
        console.error("Upload error:", error.response?.data);
        this.error = error.message || "Failed to upload image";
      } finally {
        this.uploadingImage = false;
      }
    },

    processImageData(imageData) {
      // Handle null, undefined, or empty values
      if (!imageData) {
        return "";
      }

      // Handle string URLs
      if (typeof imageData === "string") {
        // If it's already a full URL with the correct server, return as is
        if (imageData.startsWith(`${this.apiUrl}/`)) {
          return imageData;
        }

        // If it's a data URL (base64), return as is
        if (imageData.startsWith("data:")) {
          return imageData;
        }

        // If it's a full URL with wrong server, fix the server
        if (imageData.startsWith("http://") || imageData.startsWith("https://")) {
          try {
            const urlPath = new URL(imageData).pathname;
            return `${this.apiUrl}${urlPath}`;
          } catch (error) {
            console.warn("Invalid URL:", imageData);
            return "";
          }
        }

        // If it's a relative path, make it absolute with correct server
        if (imageData.startsWith("/")) {
          return `${this.apiUrl}${imageData}`;
        }

        // If it's just a filename, assume it's in uploads
        if (imageData && imageData.length > 0) {
          return `${this.apiUrl}/uploads/${imageData}`;
        }
      }

      // Handle object responses from API
      if (imageData && typeof imageData === "object") {
        if (imageData.type === "base64" && imageData.data && imageData.content_type) {
          // Small file - return as data URL
          return `data:${imageData.content_type};base64,${imageData.data}`;
        }

        if (imageData.url) {
          // Large file - ensure URL points to correct server
          if (imageData.url.startsWith(`${this.apiUrl}/`)) {
            return imageData.url;
          }
          if (imageData.url.startsWith("/")) {
            return `${this.apiUrl}${imageData.url}`;
          }
          return `${this.apiUrl}/uploads/${imageData.url}`;
        }

        // If object doesn't have expected properties, log and return empty
        console.warn("Unexpected image data object:", imageData);
        return "";
      }

      // Fallback for any other type
      console.warn("Unexpected image data type:", typeof imageData, imageData);
      return "";
    },

    removeImage() {
      // Legacy method - remove all images
      this.newProduct.image1 = "";
      this.newProduct.images = [];
    },

    compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
      return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              // Create new file with compressed data
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });

              console.log(`Compressed ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
              resolve(compressedFile);
            },
            "image/jpeg",
            quality
          );
        };

        img.src = URL.createObjectURL(file);
      });
    },

    validateFileSize(file, maxSizeMB = 5) {
      const fileSizeMB = file.size / 1024 / 1024;
      if (fileSizeMB > maxSizeMB) {
        console.warn(`File ${file.name} is ${fileSizeMB.toFixed(2)}MB, which exceeds ${maxSizeMB}MB limit`);
        return false;
      }
      return true;
    },

    isHeicFile(file) {
      return file.type === "image/heic" || file.type === "image/heif" || file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif");
    },

    async convertHeicToJpg(heicFile) {
      try {
        // Dynamically import heic2any library
        const heic2any = await import("heic2any");

        // Convert HEIC to JPG with reduced quality
        const convertedBlob = await heic2any.default({
          blob: heicFile,
          toType: "image/jpeg",
          quality: 0.7, // Reduced quality for smaller file size
        });

        // Create a new File object from the converted blob
        const jpgFile = new File([convertedBlob], heicFile.name.replace(/\.(heic|heif)$/i, ".jpg"), {
          type: "image/jpeg",
          lastModified: Date.now(),
        });

        console.log(`Converted ${heicFile.name} to ${jpgFile.name}`);

        // Compress the converted image if it's still too large
        if (!this.validateFileSize(jpgFile, 5)) {
          console.log("Converted file is still too large, compressing...");
          return await this.compressImage(jpgFile, 1000, 1000, 0.6);
        }

        return jpgFile;
      } catch (error) {
        console.error("HEIC conversion failed:", error);
        throw new Error("HEIC conversion failed. Please use a JPG or PNG image instead.");
      }
    },

    async uploadSingleFile(file) {
      const formData = new FormData();
      formData.append("file", file);

      const tokenData = JSON.parse(localStorage.getItem("tokenData"));
      if (!tokenData || !tokenData.token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.post(`${this.apiUrl}/api/upload`, formData, {
        headers: {
          Authorization: `Bearer ${tokenData.token}`,
        },
      });

      return response.data;
    },

    editProduct(product) {
      this.isEditing = true;
      this.editingProduct = product;
      this.currentStatus = "add";

      // Populate the form with existing product data
      const existingImages = [];

      // Ensure main image is first in the images array
      if (product.image1) {
        existingImages.push(product.image1);
      }

      // Add other images if they exist and aren't duplicates of main image
      if (product.images && Array.isArray(product.images)) {
        product.images.forEach((img) => {
          // Check if this image is different from main image
          const imgUrl = this.processImageData(img);
          const mainUrl = product.image1 ? this.processImageData(product.image1) : "";
          if (imgUrl !== mainUrl) {
            existingImages.push(img);
          }
        });
      }

      this.newProduct = {
        title: product.title || "",
        description: product.description || "",
        descPoints: product.descPoints ? [...product.descPoints] : [""],
        price: product.price || 0,
        quantity: product.quantity || 1,
        image1: product.image1 || "",
        images: existingImages,
        sizes: product.sizes ? [...product.sizes] : [],
        stockLevel: product.stockLevel ? { ...product.stockLevel } : {},
        postable: product.postable !== undefined ? product.postable : true,
        new: product.new !== undefined ? product.new : false,
        modelSize: product.modelSize !== undefined ? product.modelSize : false,
        modelDetails: product.modelDetails ? [...product.modelDetails] : [],
      };
    },

    getTotalStock(product) {
      return Object.values(product.stockLevel || {}).reduce((total, qty) => total + qty, 0);
    },

    isProductLive(product) {
      return this.getTotalStock(product) > 0;
    },

    getProductStatusClass(product) {
      if (this.getTotalStock(product) === 0) return "out-of-stock-badge";
      return "live-badge";
    },

    getProductStatusLabel(product) {
      if (this.getTotalStock(product) === 0) return "Out of Stock";
      return "Live";
    },

    getStatusLabel() {
      const labels = {
        live: "Live Products",
        out_of_stock: "Out of Stock Products",
        add: this.isEditing ? "Edit Product" : "Add Product",
      };
      return labels[this.currentStatus] || "Products";
    },

    handleImageError(event) {
      event.target.style.display = "none";
    },

    clearTokenData() {
      localStorage.removeItem("token");
      localStorage.removeItem("tokenData");
      delete axios.defaults.headers.common["Authorization"];
    },

    isTokenValid() {
      const tokenDataString = localStorage.getItem("tokenData");
      if (!tokenDataString) return false;

      try {
        const tokenData = JSON.parse(tokenDataString);
        const now = Date.now();
        return now < tokenData.expiresAt;
      } catch (error) {
        console.error("Invalid token data format:", error);
        return false;
      }
    },

    refreshTokenTimestamp() {
      // Extend token expiry when user is active
      const tokenDataString = localStorage.getItem("tokenData");
      if (tokenDataString) {
        try {
          const tokenData = JSON.parse(tokenDataString);
          tokenData.expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // Extend by 30 days
          localStorage.setItem("tokenData", JSON.stringify(tokenData));
        } catch (error) {
          console.error("Failed to refresh token timestamp:", error);
        }
      }
    },
  },

  created() {
    // Refresh token timestamp when component loads (user activity)
    this.refreshTokenTimestamp();
  },
  watch: {
    "newProduct.sizes": {
      handler(newSizes) {
        // Initialize stock levels for selected sizes
        const stockLevel = {};
        newSizes.forEach((size) => {
          stockLevel[size.toLowerCase()] = this.newProduct.stockLevel[size.toLowerCase()] || 0;
        });
        this.newProduct.stockLevel = stockLevel;
      },
      deep: true,
    },
  },
};
</script>

<style scoped>
.products {
  min-height: 100vh;
  background-color: var(--background-colour);
}

.products-content {
  padding: 40px;
  max-width: 1400px;
  margin: 0 auto;
}

.products-header-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.products-section h3 {
  color: var(--text-colour);
  margin: 0;
  font-size: 20px;
}

.status-filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 8px 16px;
  border: 2px solid var(--tertiary-colour);
  background: var(--back-white);
  color: var(--tertiary-colour);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  background: var(--secondary-colour);
}

.filter-btn.active {
  background: var(--primary-colour);
  color: var(--alt-text-colour);
  border-color: var(--primary-colour);
}

.add-btn.active {
  background: var(--action-colour);
  border-color: var(--action-colour);
}

.product-summary {
  background: var(--secondary-colour);
  padding: 12px 20px;
  border-radius: 6px;
  margin-bottom: 20px;
  border: 1px solid var(--tertiary-colour);
}

.product-summary p {
  margin: 0;
  color: var(--text-colour);
  font-weight: 500;
}

.loading-message,
.no-products {
  text-align: center;
  padding: 40px;
  color: var(--tertiary-colour);
  font-size: 16px;
}

.error-message {
  text-align: center;
  padding: 20px;
  background: var(--secondary-colour);
  color: var(--action-colour);
  border-radius: 8px;
  border: 1px solid var(--tertiary-colour);
}

/* Add Product Form */
.add-product-form {
  max-width: 800px;
  margin: 0 auto;
}

.form-card {
  background: var(--back-white);
  border-radius: 12px;
  box-shadow: var(--box-shadow);
  border: 1px solid var(--secondary-colour);
  padding: 30px;
}

.form-card h3 {
  color: var(--text-colour);
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  color: var(--text-colour);
  font-weight: 600;
  margin-bottom: 5px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--tertiary-colour);
  border-radius: 4px;
  box-sizing: border-box;
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

.desc-point {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
}

.remove-btn {
  background: var(--action-colour);
  color: var(--alt-text-colour);
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
}

.add-point-btn {
  background: var(--tertiary-colour);
  color: var(--alt-text-colour);
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.size-checkboxes {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.size-checkbox {
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: normal;
}

.stock-inputs {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.stock-input {
  display: flex;
  align-items: center;
  gap: 5px;
}

.stock-field {
  width: 60px;
  padding: 5px;
  border: 1px solid var(--tertiary-colour);
  border-radius: 4px;
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 30px;
}

.submit-btn {
  background: var(--primary-colour);
  color: var(--alt-text-colour);
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.cancel-btn {
  background: var(--tertiary-colour);
  color: var(--alt-text-colour);
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
}

/* Products Grid */
.products-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
}

.product-card {
  background: var(--back-white);
  border-radius: 12px;
  box-shadow: var(--box-shadow);
  border: 1px solid var(--secondary-colour);
  padding: 20px;
  transition: all 0.3s ease;
}

.product-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--box-shadow-bottom);
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--secondary-colour);
}

.product-info h4 {
  color: var(--primary-colour);
  margin: 0 0 5px 0;
  font-size: 18px;
  font-weight: 600;
}

.product-id {
  color: var(--tertiary-colour);
  font-size: 12px;
  margin: 0;
}

.price-amount {
  font-size: 20px;
  font-weight: bold;
  color: var(--action-colour);
}

.product-image {
  margin-bottom: 15px;
  text-align: center;
}

.product-image img {
  max-width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
}

.product-description {
  margin-bottom: 15px;
}

.product-description p {
  color: var(--tertiary-colour);
  font-size: 14px;
  line-height: 1.4;
}

.product-sizes,
.stock-levels {
  margin-bottom: 15px;
}

.product-sizes h5,
.stock-levels h5 {
  color: var(--text-colour);
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
}

.sizes-list {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.size-badge {
  background: var(--secondary-colour);
  color: var(--text-colour);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.stock-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  gap: 8px;
}

.stock-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--secondary-colour);
  padding: 8px;
  border-radius: 4px;
}

.size-label {
  font-size: 12px;
  color: var(--tertiary-colour);
  font-weight: 600;
}

.stock-quantity {
  font-size: 16px;
  font-weight: bold;
  color: var(--primary-colour);
}

.stock-quantity.low-stock {
  color: #856404;
}

.stock-quantity.out-of-stock {
  color: var(--action-colour);
}

.product-status-display {
  margin-bottom: 15px;
  display: flex;
  justify-content: center;
}

.live-badge {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.out-of-stock-badge {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.draft-badge {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.product-actions {
  display: flex;
  gap: 10px;
  flex-direction: column;
}

.status-btn,
.edit-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
}

.live-btn {
  background: var(--tertiary-colour);
  color: var(--alt-text-colour);
}

.live-btn.active {
  background: #28a745;
}

.edit-btn {
  background: var(--primary-colour);
  color: var(--alt-text-colour);
}

.status-btn:hover,
.edit-btn:hover {
  transform: translateY(-2px);
}

/* New fields styling */
.desc-points {
  margin-top: 10px;
}

.desc-points h5 {
  color: var(--text-colour);
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.desc-points ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.desc-points li {
  color: var(--tertiary-colour);
  font-size: 13px;
  padding: 2px 0;
  position: relative;
  padding-left: 15px;
}

.desc-points li:before {
  content: "•";
  color: var(--primary-colour);
  position: absolute;
  left: 0;
}

.product-quantity {
  margin-bottom: 15px;
  padding: 8px;
  background: var(--secondary-colour);
  border-radius: 4px;
}

.product-quantity h5 {
  color: var(--text-colour);
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.product-quantity span {
  color: var(--primary-colour);
  font-weight: bold;
}

.model-details {
  margin-bottom: 15px;
}

.model-details h5 {
  color: var(--text-colour);
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.model-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.model-list li {
  color: var(--tertiary-colour);
  font-size: 13px;
  padding: 4px 8px;
  background: var(--secondary-colour);
  margin-bottom: 4px;
  border-radius: 4px;
  font-style: italic;
}

.postable-status {
  margin-bottom: 10px;
  text-align: center;
}

.postable-badge {
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 600;
}

.postable-badge.postable {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.postable-badge.not-postable {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.new-product-badge {
  margin-bottom: 10px;
  text-align: center;
}

.new-badge {
  background: var(--action-colour);
  color: var(--alt-text-colour);
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 600;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

.checkbox-input {
  width: auto;
  margin-left: 10px;
}

.form-input:disabled {
  background-color: var(--secondary-colour);
  color: var(--tertiary-colour);
  cursor: not-allowed;
  opacity: 0.7;
}

/* Image upload styles */
.image-upload-section {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 15px;
}

.file-input {
  padding: 8px;
  border: 1px solid var(--tertiary-colour);
  border-radius: 4px;
  background: var(--back-white);
  cursor: pointer;
}

.file-input:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.upload-status {
  color: var(--primary-colour);
  font-size: 14px;
  font-weight: 500;
}

.image-preview {
  position: relative;
  display: inline-block;
  margin: 15px 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--box-shadow);
}

.preview-img {
  max-width: 300px;
  max-height: 200px;
  object-fit: cover;
  display: block;
  border-radius: 8px;
}

.remove-img-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--action-colour);
  color: var(--alt-text-colour);
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.remove-img-btn:hover {
  background: #d32f2f;
  transform: scale(1.1);
}

.manual-url-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--secondary-colour);
}

.manual-url-section label {
  display: block;
  color: var(--tertiary-colour);
  font-size: 13px;
  margin-bottom: 5px;
  font-weight: 500;
}

.file-format-info {
  font-size: 12px;
  color: var(--tertiary-colour);
  font-style: italic;
  margin-left: 10px;
}

/* Multiple images grid */
.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.image-preview-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--box-shadow);
  background: var(--back-white);
}

.image-preview-item .preview-img {
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.image-controls {
  position: absolute;
  top: 5px;
  right: 5px;
  display: flex;
  gap: 5px;
  flex-direction: column;
}

.main-btn {
  background: var(--primary-colour);
  color: var(--alt-text-colour);
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.main-btn.active {
  background: var(--action-colour);
  cursor: default;
}

.main-btn:disabled {
  cursor: default;
  opacity: 0.8;
}

.main-btn:not(:disabled):hover {
  transform: translateY(-1px);
}

.manual-url-input {
  display: flex;
  gap: 10px;
  align-items: center;
}

.add-url-btn {
  background: var(--tertiary-colour);
  color: var(--alt-text-colour);
  border: none;
  padding: 10px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.add-url-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-url-btn:not(:disabled):hover {
  background: var(--primary-colour);
}

.auto-status-info {
  background: var(--secondary-colour);
  padding: 8px 12px;
  border-radius: 6px;
  text-align: center;
  margin-bottom: 8px;
}

.status-info-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-colour);
}
</style>
