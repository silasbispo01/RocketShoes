import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);
export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
     const storagedCart = localStorage.getItem('@RocketShoes:cart');
    
     if (storagedCart) {
       return JSON.parse(storagedCart);
     }
    
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
        let item = (await api.get(`/products/${productId}`)).data
        if(productId !== item.id) toast.error('Erro na adição do produto');
        let maxStock = (await api.get(`/stock/${productId}`)).data.amount
        let exist = cart.find(item => item.id === productId)
        
        const handleNewProductAmount = (amount: number) => {
          let newProduct = cart.map(item => {
            if(item.id === productId) {
              return {
                ...item, amount
              }
            }
            return item
          }) 

          setCart(newProduct)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newProduct))
        }
       

        if(!exist) {
            item['amount'] = 1
            setCart([...cart, item])
            localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, item]))
          }
          else if(exist.amount < maxStock) {
            let amount = exist.amount + 1
            handleNewProductAmount(amount)
          } else {
            toast.error('Quantidade solicitada fora de estoque');
          }

        } catch {
          toast.error('Erro na adição do produto');
      }
  };
  
  const removeProduct = async (productId: number) => {
    try {
      let itemExist = cart.find(item => item.id === productId)
      if(!itemExist) throw toast.error('Erro na remoção do produto');
      let remainingProducts = cart.filter(item => {
        if(item.id !== productId) {
          return item
        }
      })

      if(remainingProducts) {
        setCart(remainingProducts)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(remainingProducts))
      } 
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      let maxStock = (await api.get(`/stock/${productId}`)).data.amount
      if(amount < 1) throw toast.error('Erro na alteração de quantidade do produto');
      const handleNewProductAmount = () => {
        let newProducts = cart.map(item => {
          if(item.id == productId) {
            return {
              ...item, amount
            } 
          } 
          return item
        }) 
        setCart(newProducts)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newProducts))
      }

      if(amount <= maxStock) {
        handleNewProductAmount()
      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
