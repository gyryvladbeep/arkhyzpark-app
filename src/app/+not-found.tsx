import { Redirect } from 'expo-router';

// Любой неизвестный адрес ведёт на главный экран.
// Нужно для веб-демо: при открытии по ссылке адрес страницы может не совпадать с маршрутом приложения.
export default function NotFound() {
  return <Redirect href="/" />;
}
