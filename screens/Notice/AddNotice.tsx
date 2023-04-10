import { gql, useMutation } from "@apollo/client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ActivityIndicator, TouchableOpacity } from "react-native";
import { SelectList } from "react-native-select-bottom-list";
import styled from "styled-components/native";
import { colors } from "../../color";
import DissmissKeyboard from "../../components/DismissKeyboard";
import { TUTOR_INQUIRY_FRAGMENT_NATIVE } from "../../fragments";

const ADD_NOTICE_MUTATION = gql`
  mutation createNotice(
    $id: Int
    $title: String
    $discription: String
    $sortation: String
  ) {
    createNotice(
      id: $id
      title: $title
      discription: $discription
      sortation: $sortation
    ) {
      id
      user {
        id
      }
      title
      discription
      sortation
    }
  }
`;

// Styled-Component START
const Container = styled.View`
  flex: 1;
  background-color: ${(props) => props.theme.mainBgColor};
  padding: 16px;
`;

const HeaderRightText = styled.Text`
  color: ${colors.blue};
  font-size: 16px;
  font-weight: 600;
  margin-right: 16px;
`;

const TitleContainer = styled.View``;

const Title = styled.TextInput`
  background-color: ${(props) => props.theme.grayInactColor};
  color: black;
  padding: 12px;
  border-radius: 8px;
`;

const DiscContainer = styled.View`
  height: 150px;
  margin-top: 16px;
`;

const Disc = styled.TextInput`
  background-color: ${(props) => props.theme.grayInactColor};
  color: black;
  padding: 12px;
  border-radius: 8px;
`;
// Styled-Component END

export default function AddBoard({ navigation, route }: any) {
  const { register, handleSubmit, setValue } = useForm();
  useEffect(() => {
    register("id");
    register("discription");
    register("title");
    register("sortation");
  }, [register]);

  const updateBoard = (cache: any, result: any) => {
    const {
      data: { createNotice },
    } = result;

    if (createNotice.id) {
      cache.modify({
        id: "ROOT_QUERY",
        fields: {
          seeNotices(prev: any) {
            return [createNotice, ...prev];
          },
        },
      });
      if (route.params.sortation === "group") {
        navigation.navigate("GroupDetail", { id: route.params.id });
      } else if (route.params.sortation === "tutor") {
        navigation.navigate("TutorDetail", { id: route.params.id });
      }
    }
  };

  const [addBoardMutation, { loading }] = useMutation(ADD_NOTICE_MUTATION, {
    update: updateBoard,
  });

  const HeaderRight = () => {
    return (
      <TouchableOpacity onPress={handleSubmit(onValid)}>
        <HeaderRightText>완료</HeaderRightText>
      </TouchableOpacity>
    );
  };
  const HeaderRightLoading = () => (
    <ActivityIndicator size="small" color="white" style={{ marginRight: 10 }} />
  );

  useEffect(() => {
    setValue("id", route.params.id);
    setValue("sortation", route.params.sortation);
  }, []);

  useEffect(() => {
    navigation.setOptions({
      title: "글 작성하기",
      headerRight: loading ? HeaderRightLoading : HeaderRight,
      ...(loading && { headerLeft: () => null }),
    });
  }, [loading]);

  const onValid = async ({ id, title, discription, sortation }: any) => {
    addBoardMutation({
      variables: {
        id,
        title,
        discription,
        sortation,
      },
    });
  };

  return (
    <DissmissKeyboard>
      <Container>
        <TitleContainer>
          <Title
            placeholder="제목"
            placeholderTextColor="rgba(0,0,0,0.2)"
            onChangeText={(text: string) => setValue("title", text)}
          />
        </TitleContainer>
        <DiscContainer>
          <Disc
            placeholder="내용"
            placeholderTextColor="rgba(0,0,0,0.2)"
            onSubmitEditing={handleSubmit(onValid)}
            onChangeText={(text: string) => setValue("discription", text)}
            style={{ flex: 1, textAlignVertical: "top" }}
            numberOfLines={10}
            maxLength={1000}
            multiline={true}
          />
        </DiscContainer>
      </Container>
    </DissmissKeyboard>
  );
}
