import './index.css';
import { ProductCard } from './components/ProductCard';

function App() {
  return (
    <div>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Hype Drops 👟</h1>
      {/* This renders the component we just built! */}
      <ProductCard /> 
    </div>
  );
}

export default App;