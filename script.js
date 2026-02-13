
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwYXJZzSzcgFy-GAxiCqYzfvll0znjVX3QzoaFgnmXgxPomCClbxHj0La-YdNPseAIJJw/exec'; // Replace with actual URL

document.addEventListener('DOMContentLoaded', () => {
    // Lead Magnet Form - Step 1
    const formStep1 = document.getElementById('lead-form-step-1');
    if (formStep1) {
        formStep1.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(formStep1);
            const data = Object.fromEntries(formData.entries());

            // Save to LocalStorage
            localStorage.setItem('poppypages_lead', JSON.stringify(data));

            // Redirect to Step 2
            window.location.href = 'audit.html';
        });
    }

    // Lead Magnet Form - Step 2 (Audit Info)
    const formStep2 = document.getElementById('lead-form-step-2');
    if (formStep2) {
        formStep2.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = formStep2.querySelector('button');
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;

            const formData2 = new FormData(formStep2);
            const data2 = Object.fromEntries(formData2.entries());

            // Retrieve Step 1 Data
            const step1Data = JSON.parse(localStorage.getItem('poppypages_lead') || '{}');

            // Combine Data
            const finalData = { ...step1Data, ...data2, timestamp: new Date().toISOString() };

            console.log('Submitting Data:', finalData);

            try {
                // Submit to Google Apps Script
                // Using URLSearchParams is more reliable for 'no-cors' submissions to Google
                const params = new URLSearchParams();
                for (const key in finalData) {
                    params.append(key, finalData[key]);
                }

                await fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: params
                });

                // Clear Data
                localStorage.removeItem('poppypages_lead');

                // Redirect to Thank You
                window.location.href = 'thank-you.html';

            } catch (error) {
                console.error('Error submitting form:', error);
                alert('There was an error submitting the form. Please try again.');
                submitBtn.textContent = 'Complete & Get My Pack';
                submitBtn.disabled = false;
            }
        });
    }

    // Smooth Scrolling (Legacy)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});
