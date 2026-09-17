# Assertions against the built site in _site/.
#
# There is no application code here to unit test, so these test the build
# OUTPUT. They exist because this site's worst failures have all been ones that
# build green and return 200 on every URL -- a wrong page is indistinguishable
# from a right one unless something looks at the contents.
#
#   bundle exec jekyll build && bundle exec ruby test/site_test.rb

require "minitest/autorun"
require "nokogiri"
require "json"
require "set"

SITE = File.expand_path("../_site", __dir__)
ROOT = File.expand_path("..", __dir__)

def doc(path)
  Nokogiri::HTML(File.read(File.join(SITE, path)))
end

def html_pages
  Dir.glob(File.join(SITE, "**", "*.html")).reject { |f| f.include?("/assets/") }
end

class HomepageTest < Minitest::Test
  # 2026-09-17: CLAUDE.md was added with no front matter, inherited the
  # site-wide `permalink: ""` default, collided with index.md at "/", won, and
  # replaced the live homepage for ~13 hours. The build was green throughout.
  def test_homepage_is_the_real_homepage
    title = doc("index.html").at("title")&.text.to_s
    assert_includes title, "All Seasons Fitness",
      "index.html is not the homepage -- a root-level file may have taken over '/'"
    refute_includes title.downcase, "claude",
      "index.html is rendering CLAUDE.md"
  end

  # Every root-level markdown file must either be excluded from the build or
  # declare its own permalink. This is the general form of the bug above: it
  # fails on the offending file rather than waiting for it to win the collision.
  def test_every_root_markdown_declares_a_permalink_or_is_excluded
    config = File.read(File.join(ROOT, "_config.yml"))
    excluded = config.scan(/^\s*-\s+(\S+\.md)\s*$/).flatten.to_set

    offenders = Dir.glob(File.join(ROOT, "*.md")).filter_map do |path|
      name = File.basename(path)
      next if excluded.include?(name)
      head = File.read(path, 400)
      has_permalink = head.start_with?("---") && head[/^permalink:/]
      name unless has_permalink
    end

    assert_empty offenders,
      "These root .md files have no permalink and are not excluded, so they " \
      "claim '/' and can replace the homepage: #{offenders.join(', ')}"
  end

  # _layouts/default.html hardcodes /index.css. That path exists only because
  # assets/css/style.scss pins `permalink: /index.css`. Lose the pin and every
  # page renders unstyled, with a 200 on every URL.
  def test_stylesheet_is_where_the_layout_expects_it
    assert File.exist?(File.join(SITE, "index.css")),
      "_site/index.css is missing -- the stylesheet moved; check assets/css/style.scss"
    refute_empty File.read(File.join(SITE, "index.css")).strip
  end
end

class MetadataTest < Minitest::Test
  def test_every_page_has_a_title_and_description
    html_pages.each do |f|
      d = Nokogiri::HTML(File.read(f))
      rel = f.sub("#{SITE}/", "")
      refute_nil d.at("title"), "#{rel} has no <title>"
      desc = d.at('meta[name="description"]')
      refute_nil desc, "#{rel} has no meta description"
      refute_empty desc["content"].to_s.strip, "#{rel} has an empty meta description"
    end
  end

  # A malformed JSON-LD block is invisible on the page and silently drops the
  # business out of Google's structured-data features.
  def test_all_structured_data_parses
    html_pages.each do |f|
      rel = f.sub("#{SITE}/", "")
      Nokogiri::HTML(File.read(f)).css('script[type="application/ld+json"]').each_with_index do |s, i|
        JSON.parse(s.text)
      rescue JSON::ParserError => e
        flunk "#{rel}: JSON-LD block #{i + 1} is not valid JSON: #{e.message}"
      end
    end
  end
end

# CLAUDE.md documents that the class schedule lives in TWO places that must be
# updated together: the visible table in schedule.md, and the
# openingHoursSpecification JSON-LD in _layouts/default.html that Google reads
# for local search. A human-maintained duplication with a written warning is
# the likeliest content bug on this site, so assert the two agree.
class ScheduleConsistencyTest < Minitest::Test
  DAYS = %w[Monday Tuesday Wednesday Thursday Friday Saturday Sunday].freeze

  # "10am" / "5:30pm" / "9:15am" -> "10:00" / "17:30" / "09:15"
  def to_24h(raw)
    m = raw.strip.downcase.match(/\A(\d{1,2})(?::(\d{2}))?\s*(am|pm)\z/) or return nil
    h = m[1].to_i
    h = 0 if h == 12
    h += 12 if m[3] == "pm"
    format("%02d:%02d", h, m[2].to_i)
  end

  def visible_schedule
    rows = Nokogiri::HTML(File.read(File.join(SITE, "schedule.html"))).css("table tr")
    rows.each_with_object(Set.new) do |tr, set|
      cells = tr.css("td, th").map(&:text)
      day = cells.find { |c| DAYS.include?(c.strip) } or next
      cells.join(" ").scan(/\d{1,2}(?::\d{2})?\s*[ap]m/i).each do |t|
        time = to_24h(t) or next
        set << [day.strip, time]
      end
    end
  end

  def structured_schedule
    ld = Nokogiri::HTML(File.read(File.join(SITE, "index.html")))
      .css('script[type="application/ld+json"]')
      .map { |s| JSON.parse(s.text) rescue nil }.compact
      .find { |o| o["openingHoursSpecification"] }
    refute_nil ld, "no openingHoursSpecification found in the homepage JSON-LD"

    ld["openingHoursSpecification"].each_with_object(Set.new) do |spec, set|
      Array(spec["dayOfWeek"]).each { |day| set << [day, spec["opens"]] }
    end
  end

  def test_visible_table_matches_structured_data
    visible, structured = visible_schedule, structured_schedule
    refute_empty visible, "parsed no class times out of schedule.html"

    only_visible = (visible - structured).sort
    only_structured = (structured - visible).sort

    assert_empty only_visible + only_structured, <<~MSG
      The schedule table and the JSON-LD disagree. Update BOTH schedule.md and
      the openingHoursSpecification block in _layouts/default.html.
        on the page but not in structured data: #{only_visible.inspect}
        in structured data but not on the page: #{only_structured.inspect}
    MSG
  end
end
