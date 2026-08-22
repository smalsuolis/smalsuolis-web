import React from 'react';
import HeadlessItemPicker, {
  HeadlessItemPickerProps,
  HeadlessItemT,
  RenderItemProps,
} from './HeadlessItemPicker';
import styled from 'styled-components';

export interface FilterItem {
  name: string;
}

export type FilterPickerProps = Omit<HeadlessItemPickerProps<FilterItem>, 'renderItem'>;

export type PodcastPickerProps<T extends FilterItem = FilterItem> = Omit<
  HeadlessItemPickerProps<T>,
  'renderItem' | 'contentContainerStyle'
>;

const FilterPicker = <T extends FilterItem = FilterItem>(props: PodcastPickerProps<T>) => {
  const renderItem = (item: RenderItemProps<T>) => {
    const { name } = item.item;
    const { isActive, onClick } = item;
    return (
      <FilterPickerItem key={props.getItemKey(item.item)} $isActive={isActive} onClick={onClick}>
        <FilterPickerItemText>{name}</FilterPickerItemText>
      </FilterPickerItem>
    );
  };

  return (
    <FilterPickerWrapper>
      <HeadlessItemPicker {...props} renderItem={renderItem} />
    </FilterPickerWrapper>
  );
};

const FilterPickerWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`;

// Design: a white 45px pill outlined in black — 2px once chosen — not a grey
// fill that turns green.
const FilterPickerItem = styled.div<{ $isActive: boolean }>`
  background-color: #ffffff;
  border: ${({ $isActive }) =>
    $isActive ? '2px solid #000000' : '1px solid rgba(83, 83, 83, 0.12)'};
  border-radius: 128px;
  padding: ${({ $isActive }) => ($isActive ? '11px 19px' : '12px 20px')};
  display: flex;
  width: fit-content;
  justify-content: center;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const FilterPickerItemText = styled.div`
  font-size: 1.4rem;
  line-height: 2.1rem;
  font-weight: 500;
  letter-spacing: -0.02em;
  white-space: pre;
`;

export default FilterPicker;
