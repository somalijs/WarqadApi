import '@ant-design/v5-patch-for-react-19'; // must come first
import { unstableSetRender } from 'antd';
import { createRoot } from 'react-dom/client';

// ✅ Type-safe custom root handler for React 19
unstableSetRender((node, container) => {
  const el = container as Element & {
    _reactRoot?: ReturnType<typeof createRoot>;
  };
  el._reactRoot ||= createRoot(el);
  const root = el._reactRoot;
  root.render(node);
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    root.unmount();
  };
});

// Your normal imports below
import './index.css';
import 'swiper/swiper-bundle.css';
import 'simplebar-react/dist/simplebar.min.css';
import App from './App.tsx';
import { AppWrapper } from './components/common/PageMeta.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import '@radix-ui/themes/styles.css';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <AppWrapper>
      <App />
    </AppWrapper>
  </ThemeProvider>
);
