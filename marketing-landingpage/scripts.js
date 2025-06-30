// Techniker Task Manager - Landing Page JavaScript

// State management
let isLoggedIn = false;
let currentCustomer = null;

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAnimations();
    initializeNavigation();
    initializeScrollEffects();
    initializeModals();
});

// Animation initialization
function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // Observe all animatable elements
    document.querySelectorAll('.feature-card, .spec-item, .pricing-card, .screenshot-item').forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
}

// Navigation initialization
function initializeNavigation() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.offsetTop;
                const offsetPosition = elementPosition - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Scroll effects initialization
function initializeScrollEffects() {
    // Header background on scroll
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (window.scrollY > 50) {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.backdropFilter = 'blur(10px)';
        } else {
            header.style.background = 'var(--bg-white)';
            header.style.backdropFilter = 'none';
        }
    });

    // Parallax effect for hero section
    window.addEventListener('scroll', function() {
        const hero = document.querySelector('.hero');
        if (hero) {
            const scrolled = window.pageYOffset;
            const parallax = scrolled * 0.5;
            hero.style.transform = `translateY(${parallax}px)`;
        }
    });
}

// Modal initialization
function initializeModals() {
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('loginModal');
        if (event.target === modal) {
            closeLoginModal();
        }
    });

    // Login form handling
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

// Language functions
function toggleLanguage() {
    const languages = [
        { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'ar', name: 'العربية', flag: '🇸🇦' }
    ];

    let message = 'Sprachauswahl wird in Kürze verfügbar sein!\n\nVerfügbare Sprachen:\n';
    languages.forEach(lang => {
        message += `${lang.flag} ${lang.name} (${lang.code.toUpperCase()})\n`;
    });

    showNotification(message, 'info');
}

// Login modal functions
function openLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Focus on email input
        setTimeout(() => {
            const emailInput = document.getElementById('email');
            if (emailInput) emailInput.focus();
        }, 100);
    }
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Login form handling
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="loading"></span> Anmelden...';
    submitBtn.disabled = true;
    
    // Simulate authentication delay
    setTimeout(() => {
        if (email && password) {
            // Demo authentication
            if (email.includes('@') && password.length >= 3) {
                authenticateUser(email);
            } else {
                showNotification('Bitte geben Sie gültige Anmeldedaten ein.', 'error');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        } else {
            showNotification('Bitte füllen Sie alle Felder aus.', 'error');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }, 1000);
}

// User authentication
function authenticateUser(email) {
    isLoggedIn = true;
    currentCustomer = {
        name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
        email: email,
        planType: 'Lebenslange Lizenz',
        purchaseDate: '15. Januar 2025',
        lastLogin: new Date().toLocaleDateString('de-DE')
    };
    
    // Hide landing page and show portal
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('customerPortal').style.display = 'block';
    document.getElementById('loginModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Update customer info
    updateCustomerPortal();
    
    showNotification('Erfolgreich angemeldet! Willkommen in Ihrem Kunden-Portal.', 'success');
}

// Update customer portal with user data
function updateCustomerPortal() {
    if (!currentCustomer) return;
    
    document.getElementById('customerName').textContent = currentCustomer.name;
    document.getElementById('planType').textContent = currentCustomer.planType;
    document.getElementById('purchaseDate').textContent = currentCustomer.purchaseDate;
    
    // Update subscription info
    const subscriptionInfo = document.getElementById('subscriptionInfo');
    if (subscriptionInfo) {
        subscriptionInfo.innerHTML = `
            <p><strong>Plan:</strong> <span id="planType">${currentCustomer.planType}</span></p>
            <p><strong>Status:</strong> <span style="color: var(--success-color);">✓ Aktiv</span></p>
            <p><strong>Gekauft am:</strong> <span id="purchaseDate">${currentCustomer.purchaseDate}</span></p>
            <p><strong>Letzter Login:</strong> <span>${currentCustomer.lastLogin}</span></p>
            <p><strong>Updates:</strong> <span style="color: var(--success-color);">Lebenslang inklusive</span></p>
        `;
    }
}

// Logout function
function logout() {
    isLoggedIn = false;
    currentCustomer = null;
    
    // Show landing page and hide portal
    document.getElementById('landingPage').style.display = 'block';
    document.getElementById('customerPortal').style.display = 'none';
    
    // Reset form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.reset();
    
    showNotification('Sie wurden erfolgreich abgemeldet.', 'success');
}

// Purchase functions
function buyPackage(packageType) {
    let packageData = getPackageData(packageType);
    
    // Track purchase attempt
    trackEvent('purchase_attempt', {
        package: packageType,
        price: packageData.price
    });
    
    const telegramUrl = `https://t.me/TechnikerTaskManager_Bot?start=purchase_${packageType}`;
    
    // Open Telegram
    window.open(telegramUrl, '_blank');
    
    // Show confirmation after delay
    setTimeout(() => {
        showNotification(
            `Sie werden zu unserem Telegram Bot weitergeleitet um das ${packageData.name}-Paket für ${packageData.price} zu kaufen.\n\nFalls sich Telegram nicht automatisch öffnet, suchen Sie nach "@TechnikerTaskManager_Bot" in Telegram.`,
            'info'
        );
    }, 1000);
}

// Get package data
function getPackageData(packageType) {
    const packages = {
        yearly: {
            name: 'Jahres',
            price: '450€',
            description: 'Jahres-Lizenz mit vollem Feature-Set und E-Mail Support'
        },
        lifetime: {
            name: 'Lebenslang',
            price: '1.500€',
            description: 'Lebenslange Lizenz mit Prioritäts-Support und lebenslangen Updates'
        }
    };
    
    return packages[packageType] || packages.yearly;
}

// Customer portal functions
function downloadSoftware() {
    if (!isLoggedIn) {
        showNotification('Bitte melden Sie sich an, um die Software herunterzuladen.', 'error');
        openLoginModal();
        return;
    }
    
    // Track download
    trackEvent('software_download', {
        user: currentCustomer.email,
        version: '2.1.0'
    });
    
    // Show download preparation
    const downloadBtn = document.querySelector('.download-btn');
    const originalText = downloadBtn.textContent;
    downloadBtn.innerHTML = '<span class="loading"></span> Download wird vorbereitet...';
    downloadBtn.disabled = true;
    
    // Simulate download preparation
    setTimeout(() => {
        showNotification(
            'Download wird gestartet...\n\nDie Software wird als ZIP-Datei heruntergeladen.\nNach dem Download finden Sie eine Installationsanleitung in der README.txt Datei.\n\nVersion: 2.1.0\nGröße: ~15 MB',
            'success'
        );
        
        // Reset button
        downloadBtn.textContent = originalText;
        downloadBtn.disabled = false;
        
        // In a real implementation, trigger actual download here
        console.log('Downloading software package v2.1.0...');
    }, 2000);
}

function contactSupport() {
    if (!currentCustomer) {
        showNotification('Bitte melden Sie sich an, um den Support zu kontaktieren.', 'error');
        openLoginModal();
        return;
    }
    
    const supportMessage = `Hallo Support-Team!

Ich benötige Hilfe mit dem Techniker Task Manager.

👤 Kunde: ${currentCustomer.name}
📧 E-Mail: ${currentCustomer.email}
🎫 Plan: ${currentCustomer.planType}
📅 Gekauft am: ${currentCustomer.purchaseDate}

Mein Problem/Meine Frage:
[Bitte beschreiben Sie hier Ihr Anliegen]

Vielen Dank für Ihre Unterstützung!`;
    
    const telegramUrl = `https://t.me/TechnikerTaskManager_Support?text=${encodeURIComponent(supportMessage)}`;
    
    // Track support contact
    trackEvent('support_contact', {
        user: currentCustomer.email,
        method: 'telegram'
    });
    
    window.open(telegramUrl, '_blank');
    
    showNotification('Sie werden zu unserem Support-Team weitergeleitet. Unser Team antwortet normalerweise innerhalb von 2 Stunden.', 'info');
}

// Utility functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? '#ef4444' : 'var(--primary-color)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 3000;
        max-width: 350px;
        font-size: 0.9rem;
        line-height: 1.4;
        white-space: pre-line;
        animation: slideIn 0.3s ease;
    `;
    
    notification.textContent = message;
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
        position: absolute;
        top: 5px;
        right: 8px;
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        opacity: 0.7;
    `;
    closeBtn.onclick = () => notification.remove();
    notification.appendChild(closeBtn);
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function trackEvent(eventName, data = {}) {
    // Analytics tracking
    console.log(`Event: ${eventName}`, data);
    
    // In a real implementation, send to analytics service
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, data);
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification {
        animation: slideIn 0.3s ease;
    }
`;
document.head.appendChild(style);

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // ESC to close modal
    if (e.key === 'Escape') {
        closeLoginModal();
    }
    
    // Ctrl/Cmd + K to open login
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (!isLoggedIn) {
            openLoginModal();
        }
    }
});

// Performance optimization
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Optimized scroll handler
const optimizedScrollHandler = debounce(function() {
    // Handle scroll events here
}, 16); // ~60fps

window.addEventListener('scroll', optimizedScrollHandler);

// Export functions for global access
window.toggleLanguage = toggleLanguage;
window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;
window.logout = logout;
window.buyPackage = buyPackage;
window.downloadSoftware = downloadSoftware;
window.contactSupport = contactSupport;