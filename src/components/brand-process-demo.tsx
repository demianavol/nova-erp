import {
  ArrowDown,
  ArrowRight,
  Check,
  Image,
  MessageCircle,
  Package,
  TrendingUp,
} from "lucide-react";
import { fashionProducts } from "../data/fashion-catalog";

const photo = (index: number) =>
  `${import.meta.env.BASE_URL}brand/${fashionProducts[index].image}`;
const labels = [
  "Сначала — продукт",
  "Затем — узнаваемый бренд",
  "Дальше — отклик покупателей",
];

export function BrandProcessDemo({ selected }: { selected: number }) {
  return (
    <figure
      className={`lp-process-demo lp-process-demo-${selected}`}
      aria-label={labels[selected]}
    >
      <div className="lp-demo-backplate" aria-hidden="true" />
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`lp-demo-scene${selected === index ? " is-selected" : ""}`}
          aria-hidden={selected !== index}
        >
          <div className="lp-demo-glass lp-demo-glass-back" />
          <div className="lp-demo-glass lp-demo-glass-front">
            <div className="lp-demo-pane-heading">
              <span>Enmoone</span>
              <span>
                {index === 0 ? (
                  <Package size={18} />
                ) : index === 1 ? (
                  <Image size={18} />
                ) : (
                  <TrendingUp size={18} />
                )}
              </span>
            </div>
            {index === 0 ? (
              <div className="lp-demo-product">
                <img
                  src={photo(0)}
                  width="150"
                  height="195"
                  alt="Рубашка Enmoone из каталога бренда"
                  loading="lazy"
                />
                <div>
                  <span>Женская одежда</span>
                  <strong>
                    От идеи
                    <br />к продукту
                  </strong>
                  <div className="lp-demo-product-note">
                    <Check size={15} /> Работа со спросом
                  </div>
                </div>
              </div>
            ) : index === 1 ? (
              <>
                <div className="lp-demo-photo-strip">
                  {[1, 2, 4].map((item) => (
                    <img
                      key={item}
                      src={photo(item)}
                      width="100"
                      height="130"
                      alt=""
                      loading="lazy"
                    />
                  ))}
                </div>
                <div className="lp-demo-tags">
                  <span>Контент</span>
                  <span>Продвижение</span>
                  <span>Аудитория</span>
                </div>
              </>
            ) : (
              <div className="lp-demo-feedback">
                <div>
                  <Package size={21} />
                  <span>Продукт</span>
                  <ArrowRight size={16} />
                </div>
                <div>
                  <TrendingUp size={21} />
                  <span>Продажи на Wildberries</span>
                  <ArrowDown size={16} />
                </div>
                <div>
                  <MessageCircle size={21} />
                  <span>Обратная связь покупателей</span>
                  <Check size={16} />
                </div>
              </div>
            )}
          </div>
          <div className="lp-demo-annotation lp-demo-annotation-top">
            <span>
              {index === 0
                ? "Проверяем идею"
                : index === 1
                  ? "Показываем продукт"
                  : "Собираем отклик"}
            </span>
            <svg viewBox="0 0 100 48" aria-hidden="true">
              <path d="M3 4C25 42 48 45 92 25m-11-3 11 3-4 11" />
            </svg>
          </div>
          <div className="lp-demo-annotation lp-demo-annotation-bottom">
            <svg viewBox="0 0 100 48" aria-hidden="true">
              <path d="M97 44C75 6 52 3 8 23m11 3-11-3 4-11" />
            </svg>
            <span>
              {index === 0
                ? "Развиваем ассортимент"
                : index === 1
                  ? "Находим свою аудиторию"
                  : "Улучшаем следующий продукт"}
            </span>
          </div>
        </div>
      ))}
      <figcaption>Схема работы с продуктом</figcaption>
    </figure>
  );
}
