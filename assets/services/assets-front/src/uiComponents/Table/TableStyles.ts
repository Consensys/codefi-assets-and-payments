import styled from 'styled-components';

export const TableWrapper = styled.div`
  .preTableContainer {
    display: flex;
    width: 100%;
    justify-content: space-between;
    margin-bottom: 16px;

    .tableActions {
      display: flex;
      flex-direction: row-reverse;
      align-self: flex-end;
      height: 40px;
    }
    .tableFilters {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
    }
    .tableFilterItem {
      margin: 4px 8px 4px 0px;
    }
    .tableTop {
      height: 40px;
      font-size: 16px;
      font-style: normal;
      font-weight: 600;
      line-height: 40px;
      letter-spacing: 0em;
      text-align: left;
    }
  }
  .loaderContainer {
    width: 100%;
    height: 100%;
    position: fixed;
    background-color: rgba(0, 0, 0, 0.1);
    top: 0;
    z-index: 10;
    opacity: 1;
    transition: all linear 100ms;
    .emptyTable {
      margin-top: 100px;
    }
  }
  .emptyTable {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 64px 0;
    position: relative;
    margin-top: -290px;
    min-height: 160px;
    .emptyTableTitle {
      font-size: 20px;
      margin-top: 8px;
    }
    .emptyTableBody {
      font-size: 16px;
      margin-top: 8px;
    }
  }

  .table {
    border-spacing: 0;
    overflow: auto;
    .resizeHandle {
      position: absolute;
      cursor: col-resize;
      z-index: 100;
      opacity: 0;
      background-color: #777c8c;
      /* border-right: 1px solid #777c8c; */
      border-left: 4px solid rgba(255, 255, 255, 1);
      border-right: 3px solid rgba(255, 255, 255, 1);
      height: 60%;
      top: 20%;
      transition: all linear 100ms;
      right: 0px;
      box-sizing: border-box;
      width: 9px;
      &.handleActive {
        opacity: 1;
        height: 100%;
        top: 0px;
      }
    }
    .tr {
      min-width: 100%;
    }
    .header {
      color: #000a28;
      font-weight: 600;
      font-size: 14px;
      line-height: 16px;
      width: 100%;
      background-color: transparent;
      transition: none;
      min-width: 100%;
      :hover {
        .resizeHandle {
          opacity: 1;
          transition: all linear 100ms;
          cursor: col-resize;
        }
      }
      .th {
        border-bottom: 3px solid #dfe0e6;
        place-items: center !important;
      }
      .notSortable {
        display: flex;
        align-items: center;
        padding: 8px 0px 8px 16px;
      }
      .resizing {
        background-color: #f0f7ff;
        transition: none;
      }
      .tableHeaderColumn {
        display: flex;
        align-items: center;
        padding: 8px 0px 8px 16px;
      }
    }
    .bodyEmpty {
      min-height: 290px;
    }
    .body {
      margin-top: -4px;
      min-width: 100%;
      opacity: 1;
      transition: opacity 500ms linear;
      &.hideTable {
        opacity: 0;
      }
      &.preventFade {
        transition: none;
      }
      .tr {
        :hover {
          .td {
            .td-content {
              background-color: rgba(247, 247, 247, 0.95);
            }
          }
        }
      }
      .tr:first-child {
        .td {
          .td-content {
            padding-top: 4px;
          }
          .td-content.td-default-renderer {
            padding-top: 18px;
          }
        }
      }
      .td {
        color: #475166;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        line-height: 16px;
        border-bottom: 1px solid #dfe0e6;

        .td-content {
          background-color: rgba(255, 255, 255, 0.95);
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          overflow: hidden;
        }
        .td-default-renderer {
          padding: 14px 16px 14px 16px;
        }
      }
    }

    .th {
      background-color: rgba(255, 255, 255, 1);
      overflow: hidden;
    }

    &.sticky {
      overflow: auto;
      .header,
      .body,
      .footer {
        position: sticky;
        z-index: 1;
        width: fit-content;
      }

      .footer {
        bottom: 0;
        box-shadow: 0px -3px 3px #ccc;
      }

      .body {
        position: relative;
        z-index: 0;
      }

      [data-sticky-td] {
        position: sticky;
      }

      .header {
        top: 0;
        [data-sticky-last-left-td] {
          box-shadow: 5px -3px 2px 0px #dfe0e6;
        }

        [data-sticky-first-right-td] {
          box-shadow: -5px -3px 2px 0px #dfe0e6;
        }
      }

      [data-sticky-last-left-td] {
        box-shadow: 5px 3px 2px 0px #dfe0e6;
      }

      [data-sticky-first-right-td] {
        box-shadow: -5px 3px 2px 0px #dfe0e6;
      }
    }
  }
`;

export const TablePopup = styled.div`
  background: #ffffff;
  border: 1px solid #dfe0e6;
  box-sizing: border-box;
  border-radius: 4px;
  max-height: 100%;
  max-width: 680px;
  overflow: auto;

  .tablePopupHeader {
    height: 80px;
    font-style: normal;
    font-weight: 600;
    font-size: 24px;
    line-height: 80px;
    color: #000a28;
    border-bottom: 1px solid #f0f0f2;
    display: flex;
    justify-content: space-between;
    padding: 0 32px;
  }
  .tablePopupFooter {
    height: 80px;
    border-top: 1px solid #f0f0f2;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 0 32px;
  }
  .tablePopupContent {
    padding: 16px 10px;
    .tablePopupOrderItem {
      display: flex;
      justify-content: space-between;
    }
  }
`;
