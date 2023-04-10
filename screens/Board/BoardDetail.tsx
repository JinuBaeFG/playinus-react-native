import { gql, useMutation, useQuery } from "@apollo/client";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { FlatList } from "react-native";
import styled from "styled-components/native";
import { RootStackParamList } from "../../shared.types";
import { Ionicons } from "@expo/vector-icons";
import BoardComments from "./BoardComments";
import ScreenLayout from "../../components/ScreenLayout";
import CommentComp from "../../components/board/CommentComp";
import { KeyboardAwareFlatList } from "react-native-keyboard-aware-scroll-view";
import {
  BOARD_COMMENT_FRAGMENT_NATIVE,
  BOARD_FRAGMENT_NATIVE,
} from "../../fragments";

type BoardCompNavigationProps = NativeStackNavigationProp<
  RootStackParamList,
  "BoardDetail"
>;

const SEE_BOARDS_QUERY = gql`
  query seeBoard($id: Int) {
    seeBoard(id: $id) {
      ...BoardFragmentNative
    }
  }
  ${BOARD_FRAGMENT_NATIVE}
`;

const BOARD_COMMENTS_QUERY = gql`
  query seeBoardComments($id: Int!, $offset: Int) {
    seeBoardComments(id: $id, offset: $offset) {
      ...BoardCommentFragmentNative
    }
  }
  ${BOARD_COMMENT_FRAGMENT_NATIVE}
`;

const BOARD_TOGGLE_LIKE_MUTATION = gql`
  mutation boardToggleLike($id: Int!) {
    boardToggleLike(id: $id) {
      ok
      error
    }
  }
`;

const Container = styled.SafeAreaView`
  background-color: ${(props) => props.theme.mainBgColor};
  width: 100%;
`;

const Header = styled.TouchableOpacity`
  padding: 12px;
  flex-direction: row;
  align-items: center;
`;

const UserAvatar = styled.Image`
  margin-right: 10px;
  width: 28px;
  height: 28px;
  border-radius: 50px;
`;

const UserInfoWrap = styled.View``;

const Username = styled.Text`
  color: ${(props) => props.theme.textColor};
  font-weight: 600;
`;

const BoardInfo = styled.View`
  flex-direction: row;
  align-items: center;
`;

const CreateDate = styled.Text`
  font-size: 12px;
  color: ${(props) => props.theme.textColor};
  margin-right: 8px;
`;

const Hits = styled.Text`
  font-size: 12px;
  color: ${(props) => props.theme.textColor};
`;

const File = styled.Image``;

const Actions = styled.View`
  flex-direction: row;
  align-items: center;
  margin-right: 4px;
`;

const Action = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  margin-right: 12px;
`;

const ActionText = styled.Text`
  font-size: 16px;
  color: ${(props) => props.theme.grayInactColor};
  margin-left: 4px;
`;

const Caption = styled.View`
  flex-direction: row;
  padding: 4px 16px 16px;
`;

const CaptionText = styled.Text`
  margin-left: 10px;
  color: ${(props) => props.theme.textColor};
`;

const Category = styled.View`
  flex-direction: row;
  padding: 16px 16px 4px;
`;

const CategoryText = styled.Text`
  margin-left: 10px;
  font-weight: 600;
  color: ${(props) => props.theme.textColor};
`;

const Likes = styled.Text`
  color: ${(props) => props.theme.grayInactColor};
  margin: 8px 4px;
  font-weight: 600;
`;

const CommentNumber = styled.Text`
  color: ${(props) => props.theme.grayInactColor};
  margin: 8px 4px;
  font-weight: 600;
`;

const ExtraContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
`;

const NumberContainer = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  padding: 0 16px;
`;

export default function BoardDetail({ navigation, route }: any) {
  // 게시글 정보 가져오기
  const {
    data: boardData,
    loading: boardLoading,
    refetch: boardRefetch,
  } = useQuery(SEE_BOARDS_QUERY, {
    variables: { id: route.params.id },
    fetchPolicy: "cache-and-network",
  });

  // 좋아요 버튼 액션
  const updateToggleLike = (cache: any, result: any) => {
    const {
      data: {
        boardToggleLike: { ok },
      },
    } = result;
    if (ok) {
      const boardId = `Board:${boardData?.seeBoard?.id}`;
      cache.modify({
        id: boardId,
        fields: {
          isLiked(prev: boolean) {
            return !prev;
          },
          likes(prev: number) {
            if (boardData?.seeBoard?.isLiked) {
              return prev - 1;
            }
            return prev + 1;
          },
        },
      });
    }
  };

  const [toggleLikeMutation] = useMutation(BOARD_TOGGLE_LIKE_MUTATION, {
    variables: {
      id: boardData?.seeBoard?.id,
      sortation: boardData?.seeBoard?.sortation,
    },
    update: updateToggleLike,
  });

  // 작성자 프로필로 이동
  const goToProfile = () => {
    navigation.navigate("Profile", {
      username: boardData?.seeBoard?.user.username,
      id: boardData?.seeBoard?.user.id,
    });
  };

  // 댓글 목록 가져오기
  const [refreshing, setRefreshing] = useState(false);
  const {
    data,
    loading: listLoading,
    refetch,
    fetchMore: commentsFetchMore,
  } = useQuery(BOARD_COMMENTS_QUERY, {
    variables: {
      id: boardData?.seeBoard?.id,
      offset: 0,
    },
  });

  const refresh = async () => {
    setRefreshing(true);
    await boardRefetch();
    await refetch();
    setRefreshing(false);
  };
  const commentList = ({ item: comment }: any) => {
    return <CommentComp {...comment} />;
  };

  const ListHeader = () => {
    const getDate = new Date(parseInt(boardData?.seeBoard?.createdAt));

    let date = getDate.getDate();
    let month = getDate.getMonth() + 1;
    let year = getDate.getFullYear();

    return (
      <Container>
        <Header onPress={goToProfile}>
          <UserAvatar
            resizeMode="cover"
            source={
              boardData?.seeBoard?.user.avatar === null
                ? require(`../../assets/emptyAvatar.png`)
                : { uri: boardData?.seeBoard?.user.avatar }
            }
          />
          <UserInfoWrap>
            <Username>{boardData?.seeBoard?.user.username}</Username>
            <BoardInfo>
              <CreateDate>{year + "." + month + "." + date}</CreateDate>
              <Hits>
                <Ionicons name="eye-outline" />
                {" " + boardData?.seeBoard?.hits}
              </Hits>
            </BoardInfo>
          </UserInfoWrap>
        </Header>
        <Category>
          <CategoryText>{boardData?.seeBoard?.title}</CategoryText>
        </Category>
        <Caption>
          <CaptionText>{boardData?.seeBoard?.discription}</CaptionText>
        </Caption>
        <ExtraContainer>
          <Actions>
            <Action onPress={() => toggleLikeMutation()}>
              <Ionicons
                name={boardData?.seeBoard?.isLiked ? "heart" : "heart-outline"}
                color={
                  boardData?.seeBoard?.isLiked
                    ? "tomato"
                    : "rgba(136, 136, 136, 0.4)"
                }
                size={20}
              />
              <ActionText>좋아요 {boardData?.seeBoard?.likes}</ActionText>
            </Action>
          </Actions>
        </ExtraContainer>
        <BoardComments
          id={boardData?.seeBoard?.id}
          boardCommentCount={boardData?.seeBoard?.boardCommentCount}
          refresh={refresh}
        />
      </Container>
    );
  };

  useEffect(() => {
    navigation.setOptions({
      title:
        route.params.title !== null
          ? route.params.title > 10
            ? route.params.title.substring(0, 9) + "..."
            : route.params.title
          : "제목없음",
    });
  });

  return (
    <ScreenLayout loading={listLoading}>
      <KeyboardAwareFlatList
        style={{
          flex: 1,
          width: "100%",
        }}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          return commentsFetchMore({
            variables: {
              id: boardData?.seeBoard?.id,
              offset: data?.seeBoardComments?.length,
            },
          });
        }}
        refreshing={refreshing}
        onRefresh={refresh}
        data={data?.seeBoardComments}
        keyExtractor={(comment) => "" + comment.id}
        renderItem={commentList}
        ListHeaderComponent={ListHeader}
      />
    </ScreenLayout>
  );
}