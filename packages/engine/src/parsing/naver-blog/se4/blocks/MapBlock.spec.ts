import { parseSe4Blocks } from "@tests/support/parser-test-utils.js"
import { describe, expect, it } from "vitest"

describe("NaverSe4MapBlock", () => {
  it("parses places map components into map blocks", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-placesMap se-l-default">
        <div class="se-module se-module-map-image">
          <img src="https://example.com/map.png" alt="" />
        </div>
        <div class="se-module se-module-map-text">
          <a
            class="se-map-info"
            href="#"
            data-linkdata='{"placeId":"13491802","name":"첨성대","address":"경상북도 경주시 인왕동 839-1","bookingUrl":null}'
          >
            <strong class="se-map-title">첨성대</strong>
            <p class="se-map-address">경상북도 경주시 인왕동 839-1</p>
          </a>
        </div>
        <div class="se-module se-module-map-text">
          <a
            class="se-map-info"
            href="#"
            data-linkdata='{"placeId":"1712968835","name":"외가 황리단길본점","address":"경상북도 경주시 사정로57번길 7 외가","bookingUrl":"https://booking.naver.com/booking/6/bizes/899193"}'
          >
            <strong class="se-map-title">외가 황리단길본점</strong>
            <p class="se-map-address">경상북도 경주시 사정로57번길 7 외가</p>
          </a>
        </div>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se4:map",
        props: {
          places: [
            {
              name: "첨성대",
              address: "경상북도 경주시 인왕동 839-1",
              url: "https://map.naver.com/p/search/%EC%B2%A8%EC%84%B1%EB%8C%80",
            },
            {
              name: "외가 황리단길본점",
              address: "경상북도 경주시 사정로57번길 7 외가",
              url: "https://booking.naver.com/booking/6/bizes/899193",
            },
          ],
        },
      },
    ])
  })

  it("parses map module metadata before DOM fallback", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-placesMap">
        <script
          class="__se_module_data"
          data-module-v2='{"type":"v2_map","data":{"places":[{"name":"","address":"ignored"},{"name":"카페","address":"서울","bookingUrl":"https://booking.example.com"}]}}'
        ></script>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se4:map",
        props: {
          places: [
            {
              name: "카페",
              address: "서울",
              url: "https://booking.example.com",
            },
          ],
        },
      },
    ])
  })

  it("uses search urls for map module places without booking urls", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-placesMap">
        <script
          class="__se_module_data"
          data-module-v2='{"type":"v2_map","data":{"places":[{"name":"공원","address":"부산"}]}}'
        ></script>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se4:map",
        props: {
          places: [
            {
              name: "공원",
              address: "부산",
              url: "https://map.naver.com/p/search/%EA%B3%B5%EC%9B%90",
            },
          ],
        },
      },
    ])
  })

  it("falls back to link data when map text is missing", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-placesMap">
        <a
          class="se-map-info"
          data-linkdata='{"name":"데이터 장소","address":"데이터 주소","bookingUrl":""}'
        ></a>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se4:map",
        props: {
          places: [
            {
              name: "데이터 장소",
              address: "데이터 주소",
              url: "https://map.naver.com/p/search/%EB%8D%B0%EC%9D%B4%ED%84%B0%20%EC%9E%A5%EC%86%8C",
            },
          ],
        },
      },
    ])
  })

  it("throws instead of dropping DOM map links without a title", () => {
    expect(() =>
      parseSe4Blocks(`
        <div class="se-component se-placesMap">
          <a class="se-map-info" data-linkdata='{"address":"주소만 있음"}'></a>
        </div>
      `),
    ).toThrow("SE4 map block parsing failed.")
  })

  it("uses an empty description for DOM map links without an address", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-placesMap">
        <a class="se-map-info">
          <strong class="se-map-title">제목만 있음</strong>
        </a>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se4:map",
        props: {
          places: [
            {
              name: "제목만 있음",
              address: "",
              url: "https://map.naver.com/p/search/%EC%A0%9C%EB%AA%A9%EB%A7%8C%20%EC%9E%88%EC%9D%8C",
            },
          ],
        },
      },
    ])
  })
})
