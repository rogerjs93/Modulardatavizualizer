/**
 * 📱 QRGenerator
 * 
 * Generates QR codes for sharing visualization states.
 * Uses a simple QR code generation algorithm.
 */

export class QRGenerator {
    constructor() {
        this.size = 256;
    }

    /**
     * Generate QR code for given URL
     * Uses qrcodejs library or canvas-based generation
     */
    async generate(url, container) {
        // Clear container
        container.innerHTML = '';
        
        // Check if we can use a library (loaded via CDN)
        if (typeof QRCode !== 'undefined') {
            new QRCode(container, {
                text: url,
                width: this.size,
                height: this.size,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        } else {
            // Fallback: show URL and link to QR code service
            this.generateFallback(url, container);
        }
    }

    /**
     * Fallback: Display URL and use external QR service
     */
    generateFallback(url, container) {
        const wrapper = document.createElement('div');
        wrapper.style.textAlign = 'center';
        wrapper.style.padding = '1rem';
        
        // QR code image from API
        const qrImg = document.createElement('img');
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=${this.size}x${this.size}&data=${encodeURIComponent(url)}`;
        qrImg.alt = 'QR Code';
        qrImg.style.maxWidth = '100%';
        qrImg.style.borderRadius = '8px';
        
        // URL text
        const urlText = document.createElement('p');
        urlText.textContent = 'Scan to view visualization';
        urlText.style.marginTop = '0.5rem';
        urlText.style.fontSize = '0.8rem';
        urlText.style.color = '#64748b';
        
        wrapper.appendChild(qrImg);
        wrapper.appendChild(urlText);
        container.appendChild(wrapper);
    }

    /**
     * Download QR code as PNG
     */
    downloadQR(container, filename = 'qr-code.png') {
        const canvas = container.querySelector('canvas');
        if (canvas) {
            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.click();
                URL.revokeObjectURL(url);
            });
        }
    }
}
