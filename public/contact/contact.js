document.addEventListener('DOMContentLoaded', () => {

    const contactMethods = [
        { name: 'GitHub', value: '424635328/SurveyKit', type: 'link', url: 'https://github.com/424635328/SurveyKit', icon: 'fa-github', color: 'text-gray-300' },
        { name: 'QQ', value: '点击查看详情', type: 'modal', account: '424635328', qrCode: '../assets/images/qq-qrcode.png', icon: 'fa-qq', color: 'text-sky-400' },
        { name: 'Email', value: '424635328@qq.com', type: 'link', url: 'mailto:424635328@qq.com', icon: 'fa-envelope', color: 'text-green-400' }
    ];

    const populateContactList = () => {
        const grid = document.getElementById('contact-grid');
        if (!grid) return;

        grid.innerHTML = ''; 

        contactMethods.forEach((method, index) => {
            const cardWrapper = document.createElement('div');
            cardWrapper.className = 'contact-card-wrapper';
            cardWrapper.style.setProperty('--animation-delay', `${index * 0.1}s`);

            const card = document.createElement('div');
            card.className = 'contact-card';

            const cardInner = document.createElement('div');
            cardInner.className = 'contact-card-inner';
            cardInner.innerHTML = `
                <i class="fa ${method.icon} contact-card-icon ${method.color}"></i>
                <h3 class="contact-card-title">${method.name}</h3>
                <p class="contact-card-value">${method.value}</p>
            `;
            card.appendChild(cardInner);
            
            if (method.type === 'link') {
                const link = document.createElement('a');
                link.href = method.url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.appendChild(card);
                cardWrapper.appendChild(link);
            } else if (method.type === 'modal') {
                card.dataset.modalTarget = '#qq-modal';
                card.dataset.name = method.name;
                card.dataset.account = method.account;
                card.dataset.qrcode = method.qrCode;
                cardWrapper.appendChild(card);
            }
            grid.appendChild(cardWrapper);
        });
    };

    const setupModal = () => {
        const modal = document.getElementById('qq-modal');
        if (!modal) return;
        
        const grid = document.getElementById('contact-grid');
        const closeButton = modal.querySelector('.modal-close');
        const copyButton = modal.querySelector('#copy-button');
        let copyTimeout;

        const openModal = (trigger) => {
            const modalTitle = modal.querySelector('#modal-title');
            const modalAccountText = modal.querySelector('#modal-account-text');
            const modalQrCodeLink = modal.querySelector('#modal-qrcode-link');
            const modalQrCodeImg = modal.querySelector('#modal-qrcode-img');
            
            const account = trigger.dataset.account;
            const qrCodeSrc = trigger.dataset.qrcode;

            modalTitle.textContent = trigger.dataset.name;
            modalAccountText.textContent = account;
            modalQrCodeImg.src = qrCodeSrc;
            modalQrCodeLink.href = qrCodeSrc;

            copyButton.dataset.account = account;
            
            modal.classList.remove('hidden');
        };

        const closeModal = () => {
            modal.classList.add('hidden');
            clearTimeout(copyTimeout);
            copyButton.classList.remove('copied');
            copyButton.disabled = false;
            copyButton.innerHTML = `<i class="fa fa-copy mr-2"></i> <span>复制</span>`;
        };

        grid.addEventListener('click', (event) => {
            const trigger = event.target.closest('[data-modal-target]');
            if (trigger) {
                openModal(trigger);
            }
        });
        
        copyButton.addEventListener('click', (event) => {
            const button = event.currentTarget;
            const accountToCopy = button.dataset.account;

            if (navigator.clipboard && accountToCopy) {
                navigator.clipboard.writeText(accountToCopy).then(() => {
                    button.classList.add('copied');
                    button.innerHTML = `<i class="fa fa-check mr-2"></i> <span>已复制!</span>`;
                    button.disabled = true;

                    copyTimeout = setTimeout(() => {
                        button.classList.remove('copied');
                        button.disabled = false;
                        button.innerHTML = `<i class="fa fa-copy mr-2"></i> <span>复制</span>`;
                    }, 2000);
                }).catch(err => {
                    console.error('无法复制到剪贴板: ', err);
                });
            }
        });

        closeButton.addEventListener('click', closeModal);
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
                closeModal();
            }
        });
    };

    const initTiltEffect = () => {
        const cards = document.querySelectorAll('.contact-card');
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const { width, height } = rect;
                const rotateX = (y / height - 0.5) * -15; 
                const rotateY = (x / width - 0.5) * 15;

                card.style.transition = 'transform 0.1s ease-out';
                card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
                card.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
            });
        });
    };

    populateContactList();
    setupModal();
    initTiltEffect();
});