document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const surveyId = params.get('id');
    const surveyTitle = params.get('title') || '您的问卷';

    document.getElementById('survey-title').textContent = `“${surveyTitle}”`;

    const shareLink = `${window.location.origin}/survey.html?sid=${surveyId}`;
    const linkInput = document.getElementById('share-link-input');
    linkInput.value = shareLink;
    
    new QRCode(document.getElementById("qrcode"), {
        text: shareLink,
        width: 160,
        height: 160,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });

    document.getElementById('copy-link-btn').addEventListener('click', (e) => {
        navigator.clipboard.writeText(linkInput.value);
        const btn = e.currentTarget;
        const originalIcon = btn.innerHTML;
        btn.innerHTML = '<i class="fa fa-check"></i>';
        setTimeout(() => { btn.innerHTML = originalIcon; }, 1500);
    });
    
    document.getElementById('current-year-footer').textContent = new Date().getFullYear();
    document.querySelectorAll('[data-animate]').forEach(el => el.classList.add('is-visible'));
});