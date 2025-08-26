const slides = document.querySelectorAll(".about-top__slider img");
const prevBtn = document.querySelector(".about-top__arrow--prev");
const nextBtn = document.querySelector(".about-top__arrow--next");
const dots = document.querySelectorAll(".about-top__dots .dot");
let current = 0;
const total = slides.length;

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === index);
    dots[i].classList.toggle("active", i === index);
  });
}

// ボタン操作
prevBtn.addEventListener("click", () => {
  current = (current - 1 + total) % total;
  showSlide(current);
});

nextBtn.addEventListener("click", () => {
  current = (current + 1) % total;
  showSlide(current);
});

// ドット操作
dots.forEach((dot, i) => {
  dot.addEventListener("click", () => showSlide(i));
});

// 初期表示
showSlide(current);

// 自動スライド（任意）
setInterval(() => {
  current = (current + 1) % total;
  showSlide(current);
}, 5000);