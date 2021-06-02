import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdditionalItem,
  AdditionalItemText,
  AdditionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      const { data } = await api.get<Food>(`foods/${routeParams.id}`);
      api.get<Food[]>('favorites').then(response => {
        const favoritedItem = response.data.filter(
          (item: Food) => item.id === routeParams.id,
        );

        if (favoritedItem.length > 0) {
          setIsFavorite(true);
        }
      });

      setFood({
        ...data,
        formattedPrice: formatValue(data.price),
      });
      setExtras(
        data.extras.map((item: Extra) => ({
          ...item,
          quantity: 0,
        })),
      );
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    // Increment extra quantity
    const updatedExtras = extras.map((extra: Extra) => {
      if (extra.id === id) {
        return {
          ...extra,
          quantity: extra.quantity + 1,
        };
      }
      return extra;
    });
    setExtras(updatedExtras);
  }

  function handleDecrementExtra(id: number): void {
    // Decrement extra quantity
    const updatedExtras = extras.map((extra: Extra) => {
      if (extra.id === id && extra.quantity > 0) {
        return {
          ...extra,
          quantity: extra.quantity - 1,
        };
      }
      return extra;
    });
    setExtras(updatedExtras);
  }

  function handleIncrementFood(): void {
    // Increment food quantity
    setFoodQuantity(oldState => oldState + 1);
  }

  function handleDecrementFood(): void {
    // Decrement food quantity
    if (foodQuantity > 1) {
      setFoodQuantity(oldState => oldState - 1);
    }
  }

  const toggleFavorite = useCallback(() => {
    // Toggle if food is favorite or not
    if (!isFavorite) {
      api.post('favorites', food).then(() => {
        setIsFavorite(true);
      });
    } else {
      api.delete(`favorites/${food.id}`).then(() => {
        setIsFavorite(false);
      });
    }
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    // Calculate cartTotal
    const initialValue = 0;
    const subTotalExtras = extras.reduce((accumulator, currentValue) => {
      return accumulator + currentValue.quantity * currentValue.value;
    }, initialValue);
    const subTotal = food.price + subTotalExtras;

    const amount = subTotal * foodQuantity;
    return formatValue(amount);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // Finish the order and save on the API
    await api.post('orders', { food });
    const response = await api.get('orders');
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdditionalItem key={extra.id}>
              <AdditionalItemText>{extra.name}</AdditionalItemText>
              <AdditionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdditionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdditionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdditionalQuantity>
            </AdditionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdditionalItemText testID="food-quantity">
                {foodQuantity}
              </AdditionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
