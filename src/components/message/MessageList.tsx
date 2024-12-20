import React, {
  ReactNode,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { bindActionCreators } from "redux";
import { saveAs } from "file-saver";

import {
  ChatLog,
  ChatMessage,
  ChatMessageMeta,
  ChatMessageMetaItem,
  ChatBubble,
  Separator,
  Badge,
  Box,
  MediaObject,
} from "@twilio-paste/core";
import { CustomizationProvider } from "@twilio-paste/core/customization";
import { getBlobFile } from "../../api";
import { actionCreators, AppState } from "../../store";
import ImagePreviewModal from "../modals/ImagePreviewModal";
import MessageMedia from "./MessageMedia";
import { ReduxConversation } from "../../store/reducers/convoReducer";
import {
  ReduxMedia,
  ReduxMessage,
} from "../../store/reducers/messageListReducer";
import {
  getSdkMediaObject,
  getSdkParticipantObject,
} from "../../conversations-objects";
import { getSdkConversationObject } from "../../conversations-objects";
import { ReduxParticipant } from "../../store/reducers/participantsReducer";
import { MessageStatus } from "./MessageStatus";
import { MAX_MESSAGE_LINE_WIDTH } from "../../constants";
import wrap from "word-wrap";
import {
  getMessageTime,
  getFirstMessagePerDate,
} from "./../../utils/timestampUtils";
import { useDropzone } from "react-dropzone";
import { MAX_FILE_SIZE } from "../../constants";
import { Client } from "@twilio/conversations";
interface MessageListProps {
  messages: ReduxMessage[];
  conversation: ReduxConversation;
  participants: ReduxParticipant[];
  lastReadIndex: number;
  use24hTimeFormat: boolean;
  handleDroppedFiles: (droppedFiles: File[]) => void;
}

const MetaItemWithMargin: React.FC<{ children: ReactNode }> = (props) => (
  <ChatMessageMetaItem>
    <div style={{ marginTop: "5px" }}>{props.children}</div>
  </ChatMessageMetaItem>
);

const MessageList: React.FC<MessageListProps> = (props: MessageListProps) => {
  const {
    messages,
    conversation,
    lastReadIndex,
    use24hTimeFormat,
    handleDroppedFiles,
  } = props;

  if (messages === undefined) {
    return <div className="empty" />;
  }

  // const theme = useTheme();
  const myRef = useRef<HTMLInputElement>(null);

  const dispatch = useDispatch();
  const { addAttachment, addNotifications, updateUser } = bindActionCreators(
    actionCreators,
    dispatch
  );
  const conversationAttachments = useSelector(
    (state: AppState) => state.attachments[conversation.sid]
  );
  const users = useSelector((state: AppState) => state.users);
  const token = useSelector((state: AppState) => state.token);

  const [imagePreview, setImagePreview] = useState<{
    message: ReduxMessage;
    file: Blob;
    sid: string;
  } | null>(null);

  const [horizonMessageCount, setHorizonMessageCount] = useState<number>(0);
  // const [showHorizonIndex, setShowHorizonIndex] = useState<number>(0);
  const [scrolledToHorizon, setScrollToHorizon] = useState(false);
  const [firstMessagePerDay, setFirstMessagePerDay] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const today = new Date().toDateString();

  const onDrop = useCallback((acceptedFiles) => {
    setFiles(acceptedFiles);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    maxSize: MAX_FILE_SIZE,
    accept: {
      "image/*": [".png", ".jpeg", ".jpg", ".gif"],
    },
  });

  useEffect(() => {
    if (scrolledToHorizon || !myRef.current) {
      return;
    }
    myRef.current.scrollIntoView({
      behavior: "smooth",
    });
    setScrollToHorizon(true);
  });

  useEffect(() => {
    if (lastReadIndex === -1 || horizonMessageCount) {
      return;
    }
    // const showIndex = 0;
    getSdkConversationObject(conversation)
      .getUnreadMessagesCount()
      .then((count) => {
        setHorizonMessageCount(count ?? 0);
        // setShowHorizonIndex(showIndex);
      });
  }, [messages, lastReadIndex]);

  // Updates the user list based on message authors to be able to get friendly names
  useEffect(() => {
    messages.forEach((message) => {
      const participant = message.participantSid
        ? participantsBySid.get(message.participantSid)
        : null;
      if (participant && participant.identity) {
        if (!users[participant.identity]) {
          const sdkParticipant = getSdkParticipantObject(participant);
          sdkParticipant.getUser().then((sdkUser) => {
            updateUser(sdkUser);
          });
        }
      }
      setFirstMessagePerDay(getFirstMessagePerDate(messages));
    });
  }, [messages]);

  useEffect(() => {
    const abortController = new AbortController();
    handleDroppedFiles(files);
    return () => {
      abortController.abort();
    };
  }, [files]);

  // function setTopPadding(index: number) {
  //   if (
  //     props.messages[index] !== undefined &&
  //     props.messages[index - 1] !== undefined &&
  //     props.messages[index].author === props.messages[index - 1].author
  //   ) {
  //     return theme.space.space20;
  //   }
  //   return theme.space.space50;
  // }

  const onDownloadAttachments = async (message: ReduxMessage) => {
    const attachedMedia = message.attachedMedia?.map(getSdkMediaObject);
    if (message.index === -1) {
      return undefined;
    }
    if (!attachedMedia?.length) {
      return new Error("No media attached");
    }

    for (const media of attachedMedia) {
      const blob = await getBlobFile(media, addNotifications);
      addAttachment(props.conversation.sid, message.sid, media.sid, blob);
    }

    return;
  };

  const onFileOpen = (file: Blob, { filename }: ReduxMedia) => {
    saveAs(file, filename ?? "");
  };

  const participantsBySid = new Map(props.participants.map((p) => [p.sid, p]));

  const getAuthorFriendlyName = (message: ReduxMessage) => {
    const author = message.author ?? "";
    if (message.participantSid == null) return author;

    const participant = participantsBySid.get(message.participantSid);
    if (participant == null || participant.identity == null) return author;

    const user = users[participant.identity];
    return user?.friendlyName || author;
  };

  return (
    <CustomizationProvider
      elements={{
        MY_CUSTOM_CHATLOG: {
          backgroundColor: isDragActive
            ? "colorBackgroundPrimaryWeakest"
            : null,
          paddingRight: "space0",
          paddingLeft: "space0",
        },
        CHAT_MESSAGE: {
          marginRight: "space0",
          justifyContent: "flex-start",
        },
        MEDIA_OBJECT: {
          cursor: "pointer",
        },
      }}
    >
      <ChatLog {...getRootProps()} element="MY_CUSTOM_CHATLOG">
        <input {...getInputProps()} />
        {messages.map((message) => {
          const messageImages: ReduxMedia[] = [];
          const messageFiles: ReduxMedia[] = [];
          const currentDateCreated = message.dateCreated ?? null;
          (message.attachedMedia || []).forEach((file) => {
            const { contentType } = file;
            if (contentType.includes("image")) {
              messageImages.push(file);
              return;
            }
            messageFiles.push(file);
          });

          const wrappedBody = wrap(message.body?.replace(/\\n/g, "\n") ?? "", {
            width: MAX_MESSAGE_LINE_WIDTH,
            indent: "",
            cut: true,
          });

          const isOutbound =
            message.author === localStorage.getItem("username");
          let metaItems = [
            // <ChatMessageMetaItem key={0}>
            //   <Reactions
            //     reactions={attributes.reactions}
            //     onReactionsChanged={(reactions) => {
            //       getSdkMessageObject(message).updateAttributes({
            //         ...attributes,
            //         reactions,
            //       });
            //     }}
            //   />
            // </ChatMessageMetaItem>,
            <MetaItemWithMargin key={1}>
              <MessageStatus
                message={message}
                channelParticipants={props.participants}
              />
            </MetaItemWithMargin>,
            <MetaItemWithMargin key={2}>
              <span style={{ whiteSpace: "pre-wrap" }}>
                {isOutbound
                  ? `${getAuthorFriendlyName(message)}\n${getMessageTime(
                      message,
                      use24hTimeFormat
                    )}`
                  : `${getMessageTime(
                      message,
                      use24hTimeFormat
                    )}\n${getAuthorFriendlyName(message)}`}
              </span>
            </MetaItemWithMargin>,
          ];

          if (isOutbound) {
            metaItems = metaItems.reverse();
          }

          return (
            <div key={message.sid}>
              {currentDateCreated && firstMessagePerDay.includes(message.sid) && (
                <>
                  <Separator
                    orientation="horizontal"
                    verticalSpacing="space50"
                  />
                  <Box
                    display="flex"
                    flexWrap="wrap"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Badge as="span" variant="neutral">
                      {currentDateCreated.toDateString() === today
                        ? "Today"
                        : currentDateCreated.toDateString()}
                    </Badge>
                  </Box>
                </>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: `${
                    getAuthorFriendlyName(message) === "mangoES"
                      ? "flex-end"
                      : "flex-start"
                  }`,
                }}
              >
                <ChatMessage
                  variant={isOutbound ? "outbound" : "inbound"}
                  key={`${message.sid}.message`}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: `${
                        getAuthorFriendlyName(message) === "mangoES"
                          ? "flex-end"
                          : "flex-start"
                      }`,
                    }}
                  >
                    <ChatBubble>
                      {wrappedBody}
                      <MessageMedia
                        key={message.sid}
                        attachments={conversationAttachments?.[message.sid]}
                        onDownload={async () =>
                          await onDownloadAttachments(message)
                        }
                        images={messageImages}
                        files={messageFiles}
                        sending={message.index === -1}
                        onOpen={(
                          mediaSid: string,
                          image?: ReduxMedia,
                          file?: ReduxMedia
                        ) => {
                          if (file) {
                            onFileOpen(
                              conversationAttachments?.[message.sid][mediaSid],
                              file
                            );
                            return;
                          }
                          if (image) {
                            setImagePreview({
                              message,
                              file: conversationAttachments?.[message.sid][
                                mediaSid
                              ],
                              sid: mediaSid,
                            });
                          }
                        }}
                      />
                    </ChatBubble>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: `${
                        getAuthorFriendlyName(message) === "mangoES"
                          ? "flex-end"
                          : "flex-start"
                      }`,
                    }}
                  >
                    <MediaObject
                      verticalAlign="center"
                      onClick={async () => {
                        const userConfirmed =
                          window.confirm("이 작업을 진행하시겠습니까?");

                        // 사용자가 확인을 눌렀을 경우에만 코드 실행
                        if (userConfirmed) {
                          const client = new Client(token);

                          try {
                            const subscribedConvo =
                              await client.getConversationBySid(
                                conversation.sid
                              );
                            const messagestoFind =
                              await subscribedConvo.getMessages();
                            const messageToRemove: any =
                              messagestoFind.items.find(
                                (item: { sid: string }) =>
                                  item.sid === message.sid
                              );

                            if (messageToRemove) {
                              await messageToRemove.remove();
                              alert("메시지가 성공적으로 삭제되었습니다.");
                            } else {
                              alert("해당 메시지를 찾을 수 없습니다.");
                            }
                          } catch (error) {
                            console.error("오류 발생:", error);
                            alert(
                              "오류가 발생했습니다. 콘솔 로그를 확인하세요."
                            );
                          }
                        } else {
                          alert("작업이 취소되었습니다.");
                        }
                      }}
                    >
                      {/* <MediaFigure spacing="space20">
                        <DeleteIcon
                          decorative={false}
                          title="Delete"
                          color="colorTextErrorStrong"
                        />
                      </MediaFigure> */}
                    </MediaObject>
                    <ChatMessageMeta
                      aria-label={`said by ${getAuthorFriendlyName(message)}`}
                    >
                      {metaItems}
                    </ChatMessageMeta>
                  </div>
                </ChatMessage>
              </div>
            </div>
            // todo: delete only when full functionality is transferred over
            // <div key={message.sid + "message"}>
            //   {lastReadIndex !== -1 &&
            //   horizonMessageCount &&
            //   showHorizonIndex === message.index ? (
            //     <Horizon ref={myRef} messageCount={horizonMessageCount} />
            //   ) : null}
            //   <MessageView
            //     reactions={attributes["reactions"]}
            //     text={wrappedBody}
            //     media={
            //       message.attachedMedia?.length ? (
            //         <MessageMedia
            //           key={message.sid}
            //           attachments={conversationAttachments?.[message.sid]}
            //           onDownload={async () =>
            //             await onDownloadAttachments(message)
            //           }
            //           images={messageImages}
            //           files={messageFiles}
            //           sending={message.index === -1}
            //           onOpen={(
            //             mediaSid: string,
            //             image?: ReduxMedia,
            //             file?: ReduxMedia
            //           ) => {
            //             if (file) {
            //               onFileOpen(
            //                 conversationAttachments?.[message.sid][mediaSid],
            //                 file
            //               );
            //               return;
            //             }
            //             if (image) {
            //               setImagePreview({
            //                 message,
            //                 file: conversationAttachments?.[message.sid][
            //                   mediaSid
            //                 ],
            //                 sid: mediaSid,
            //               });
            //             }
            //           }}
            //         />
            //       ) : null
            //     }
            //     author={message.author ?? ""}
            //     getStatus={getMessageStatus(message, props.participants)}
            //     onDeleteMessage={async () => {
            //       try {
            //         await getSdkMessageObject(message).remove();
            //         successNotification({
            //           message: "Message deleted.",
            //           addNotifications,
            //         });
            //       } catch (e) {
            //         unexpectedErrorNotification(e.message, addNotifications);
            //       }
            //     }}
            //     topPadding={setTopPadding(index)}
            //     lastMessageBottomPadding={index === messagesLength - 1 ? 16 : 0}
            //     sameAuthorAsPrev={setTopPadding(index) !== theme.space.space20}
            //     messageTime={getMessageTime(message)}
            //     updateAttributes={(attribute) =>
            //       getSdkMessageObject(message).updateAttributes({
            //         ...attributes,
            //         ...attribute,
            //       })
            //     }
            //   />
            // </div>
          );
        })}
        {imagePreview
          ? (function () {
              const dateString = imagePreview?.message.dateCreated;
              const date = dateString ? new Date(dateString) : "";
              return (
                <ImagePreviewModal
                  image={imagePreview.file}
                  isOpen={!!imagePreview}
                  author={
                    imagePreview
                      ? getAuthorFriendlyName(imagePreview.message)
                      : ""
                  }
                  date={
                    date
                      ? date.toDateString() +
                        ", " +
                        date.getHours() +
                        ":" +
                        (date.getMinutes() < 10 ? "0" : "") +
                        date.getMinutes()
                      : ""
                  }
                  handleClose={() => setImagePreview(null)}
                  onDownload={() => {
                    saveAs(
                      imagePreview.file,
                      imagePreview.message.attachedMedia?.find(
                        ({ sid }) => sid === imagePreview.sid
                      )?.filename ?? ""
                    );
                  }}
                />
              );
            })()
          : null}
      </ChatLog>
    </CustomizationProvider>
  );
};

export default MessageList;
